"""Shared helpers for the ai/ notebooks: loading, local time, weather, hourly station grid, features."""
from pathlib import Path
import json
import time

import numpy as np
import pandas as pd
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

AI_DIR = Path(__file__).resolve().parent
DATA_DIR = AI_DIR.parent / "data"
CLEAN_DIR = DATA_DIR / "cleaned"
EXTERNAL_DIR = DATA_DIR / "external"
MODEL_DIR = AI_DIR / "models"

# ---------------------------------------------------------------- plot style

SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
GREY = "#898781"
SEQ = LinearSegmentedColormap.from_list(
    "seq_blue", ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"])
DIV = LinearSegmentedColormap.from_list("div_blue_red", ["#184f95", "#6da7ec", "#f0efec", "#ec8a89", "#b42c2c"])


def set_style():
    mpl.rcParams.update({
        "figure.facecolor": "#fcfcfb", "axes.facecolor": "#fcfcfb", "savefig.facecolor": "#fcfcfb",
        "axes.edgecolor": "#c3c2b7", "axes.labelcolor": "#52514e", "axes.titlecolor": "#0b0b0b",
        "axes.titlesize": 11, "axes.titleweight": "bold", "axes.labelsize": 9,
        "axes.spines.top": False, "axes.spines.right": False, "axes.axisbelow": True,
        "axes.grid": True, "grid.color": "#e1e0d9", "grid.linewidth": 0.6,
        "xtick.color": "#898781", "ytick.color": "#898781", "xtick.labelsize": 8, "ytick.labelsize": 8,
        "legend.frameon": False, "legend.fontsize": 8,
        "lines.linewidth": 2, "axes.prop_cycle": mpl.cycler(color=SERIES),
        "figure.dpi": 110, "figure.figsize": (9, 4),
    })


# ---------------------------------------------------------------- loading

def load_raw():
    """Raw CSVs (bike_types from the team's cleaned file)."""
    return {
        "trips": pd.read_csv(DATA_DIR / "trips_small.csv"),
        "cities": pd.read_csv(DATA_DIR / "cities.csv"),
        "bike_types": pd.read_csv(CLEAN_DIR / "bike_types_clean.csv"),
        "bikes": pd.read_csv(DATA_DIR / "bikes.csv"),
        "stations": pd.read_csv(DATA_DIR / "stations.csv"),
        "status": pd.read_csv(DATA_DIR / "stations_status.csv"),
    }


def load_clean(name):
    return pd.read_pickle(CLEAN_DIR / f"{name}.pkl")


def save_clean(df, name):
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    df.to_pickle(CLEAN_DIR / f"{name}.pkl")


# ---------------------------------------------------------------- geo / time

def haversine_m(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6_371_000 * np.arcsin(np.sqrt(a))


def local_time(epoch_s, tz):
    """epoch seconds (Series) + IANA tz per row (Series) -> naive local datetime Series."""
    utc = pd.to_datetime(epoch_s, unit="s", utc=True)
    out = pd.Series(pd.NaT, index=epoch_s.index, dtype="datetime64[ns]")
    for zone, idx in tz.groupby(tz).groups.items():
        out.loc[idx] = utc.loc[idx].dt.tz_convert(zone).dt.tz_localize(None).astype("datetime64[ns]")
    return out


def add_calendar(df, local_col, prefix=""):
    t = df[local_col]
    df[prefix + "hour"] = t.dt.hour.astype("int8")
    df[prefix + "dow"] = t.dt.dayofweek.astype("int8")
    df[prefix + "weekend"] = (df[prefix + "dow"] >= 5).astype("int8")
    df[prefix + "month"] = t.dt.month.astype("int8")
    df[prefix + "hour_sin"] = np.sin(2 * np.pi * df[prefix + "hour"] / 24).astype("float32")
    df[prefix + "hour_cos"] = np.cos(2 * np.pi * df[prefix + "hour"] / 24).astype("float32")
    df[prefix + "doy_sin"] = np.sin(2 * np.pi * t.dt.dayofyear / 365.25).astype("float32")
    df[prefix + "doy_cos"] = np.cos(2 * np.pi * t.dt.dayofyear / 365.25).astype("float32")
    return df


# ---------------------------------------------------------------- weather (Open-Meteo archive)

WEATHER_VARS = ["temperature_2m", "precipitation", "wind_speed_10m"]


def fetch_weather(cities, start="2022-08-25", end="2023-07-16", cache=None, batch=25):
    """Hourly weather per city (UTC). Cached to CSV; network only on first run."""
    import requests
    cache = Path(cache or EXTERNAL_DIR / "weather_hourly.csv")
    if cache.exists():
        w = pd.read_csv(cache)
        if w.city_id.isin(cities.id).all() and set(cities.id) <= set(w.city_id) \
                and w.time_utc.min() <= start and w.time_utc.max() >= end:
            return w
    frames = []
    cities = cities.reset_index(drop=True)
    for i in range(0, len(cities), batch):
        chunk = cities.iloc[i:i + batch]
        params = {
            "latitude": ",".join(chunk.lat.round(4).astype(str)),
            "longitude": ",".join(chunk.lon.round(4).astype(str)),
            "start_date": start, "end_date": end,
            "hourly": ",".join(WEATHER_VARS), "timezone": "GMT",
        }
        for attempt in range(5):
            r = requests.get("https://archive-api.open-meteo.com/v1/archive", params=params, timeout=120)
            if r.status_code == 200:
                break
            time.sleep(20 * (attempt + 1))
        r.raise_for_status()
        res = r.json()
        res = res if isinstance(res, list) else [res]
        for cid, loc in zip(chunk.id, res):
            h = pd.DataFrame(loc["hourly"])
            h["city_id"] = cid
            frames.append(h)
    w = pd.concat(frames).rename(columns={"time": "time_utc"})
    cache.parent.mkdir(parents=True, exist_ok=True)
    w.to_csv(cache, index=False)
    return w


def weather_lookup(weather):
    """Weather indexed by (city_id, epoch hour)."""
    w = weather.copy()
    w["hour_epoch"] = ((pd.to_datetime(w.time_utc) - pd.Timestamp(0)) // pd.Timedelta(hours=1)).astype("int64")
    return w[["city_id", "hour_epoch"] + WEATHER_VARS].astype({v: "float32" for v in WEATHER_VARS})


# ---------------------------------------------------------------- station status -> hourly grid

STATE_COLS = ["bikes", "booked_bikes", "bikes_available_to_rent", "free_racks", "free_special_racks", "maintenance"]


def clean_status(status):
    s = status.sort_values(["station_id", "time"]).reset_index(drop=True).copy()
    s["booked_bikes"] = s["booked_bikes"].clip(lower=0)
    s["maintenance"] = s["maintenance"].astype("int8")
    s["obs_idx"] = s.groupby("station_id").cumcount().astype("int32")
    return s


def hourly_grid(status, max_gap_h=168, start=None, end=None):
    """
    Status is a change log -> state at hour t = last record at or before t.
    One row per station per UTC hour between its first and last record.
    `valid` = False when t sits inside a hole longer than max_gap_h (no data, not "no change").
    """
    s = status
    span = s.groupby("station_id").time.agg(["min", "max"])
    h0 = np.ceil(span["min"] / 3600).astype("int64")
    h1 = np.floor(span["max"] / 3600).astype("int64")
    if start is not None:
        h0 = np.maximum(h0, int(pd.Timestamp(start).timestamp() // 3600))
    if end is not None:
        h1 = np.minimum(h1, int(pd.Timestamp(end).timestamp() // 3600))
    n = (h1 - h0 + 1).clip(lower=0)
    sid = np.repeat(span.index.values, n.values)
    offs = np.arange(n.sum()) - np.repeat(np.cumsum(n.values) - n.values, n.values)
    hour = np.repeat(h0.values, n.values) + offs
    g = pd.DataFrame({"station_id": sid, "hour_epoch": hour})
    g["t"] = g.hour_epoch * 3600.0

    left = g.sort_values("t")
    right = s[["station_id", "time"] + STATE_COLS + ["obs_idx"]].sort_values("time")
    back = pd.merge_asof(left, right, left_on="t", right_on="time", by="station_id", direction="backward")
    fwd = pd.merge_asof(left[["station_id", "t"]], right[["station_id", "time"]].rename(columns={"time": "t_next"}),
                        left_on="t", right_on="t_next", by="station_id", direction="forward")
    back["t_next"] = fwd["t_next"].values
    g = back.sort_values(["station_id", "hour_epoch"]).reset_index(drop=True)
    gap_h = (g.t_next.fillna(g.time) - g.time) / 3600
    g["valid"] = (gap_h <= max_gap_h) & g.time.notna()
    g["since_change_h"] = ((g.t - g.time) / 3600).astype("float32")
    g = g.drop(columns=["t", "t_next"]).rename(columns={"time": "last_obs_time"})
    for c in STATE_COLS[:-1]:
        g[c] = g[c].astype("float32")
    return g


def station_capacity(status):
    """Observed capacity: 99th pct of docked + free docks (works for rack-less stations too)."""
    tot = status.bikes + status.free_racks + status.free_special_racks
    return tot.groupby(status.station_id).quantile(0.99).clip(lower=1).rename("capacity").astype("float32")


# ---------------------------------------------------------------- supervised features

LAGS = [1, 2, 3, 23, 24, 167, 168]


def add_history_features(g):
    """Lags/rolling on a per-station contiguous hourly grid (sorted by station, hour)."""
    a = g["bikes_available_to_rent"]
    grp = g.groupby("station_id", sort=False)
    for k in LAGS:
        g[f"avail_lag{k}"] = grp["bikes_available_to_rent"].shift(k).astype("float32")
    g["d1"] = (a - g.avail_lag1).astype("float32")
    g["d3"] = (a - g.avail_lag3).astype("float32")
    # what happened in the coming hour yesterday / last week
    g["next_d_yday"] = (g.avail_lag23 - g.avail_lag24).astype("float32")
    g["next_d_lweek"] = (g.avail_lag167 - g.avail_lag168).astype("float32")
    g["roll24_mean"] = grp["bikes_available_to_rent"].transform(lambda x: x.rolling(24, min_periods=1).mean()).astype("float32")
    g["roll24_std"] = grp["bikes_available_to_rent"].transform(lambda x: x.rolling(24, min_periods=2).std()).astype("float32")
    idx = g["obs_idx"]
    g["changes_1h"] = (idx - grp["obs_idx"].shift(1)).astype("float32")
    g["changes_24h"] = (idx - grp["obs_idx"].shift(24)).astype("float32")
    g["target"] = grp["bikes_available_to_rent"].shift(-1)
    g["target_ok"] = grp["valid"].shift(-1, fill_value=False) & (grp["maintenance"].shift(-1) == 0)
    return g


def add_static_features(g, stations, cities, capacity):
    meta = stations[["id", "city_id", "bike_racks", "special_racks"]].rename(columns={"id": "station_id"})
    g = g.merge(meta, on="station_id", how="left")
    g = g.merge(capacity, left_on="station_id", right_index=True, how="left")
    g["capacity"] = g["capacity"].fillna((g.bike_racks + g.special_racks.clip(lower=0)).clip(lower=1))
    g["fill"] = (g.bikes / g.capacity).astype("float32")
    g["free_total"] = (g.free_racks + g.free_special_racks).astype("float32")
    tz = g.city_id.map(cities.set_index("id").timezone)
    g["local_time"] = local_time(g.hour_epoch * 3600, tz)
    g = add_calendar(g, "local_time")
    return g


def station_hour_profile(g_train):
    """Per station x local hour x weekend: mean availability and mean next-hour change (train period only)."""
    d = g_train[g_train.valid & g_train.target_ok & (g_train.maintenance == 0)]
    d = d.assign(delta=d.target - d.bikes_available_to_rent)
    p = d.groupby(["station_id", "hour", "weekend"]).agg(
        prof_avail=("bikes_available_to_rent", "mean"),
        prof_delta=("delta", "mean"),
        prof_absdelta=("delta", lambda x: x.abs().mean()),
    ).astype("float32").reset_index()
    return p


def fit_station_profile(status_raw, stations, cities, capacity, end):
    """station_hour_profile from status strictly before `end` (no look-ahead)."""
    s = clean_status(status_raw[status_raw.time < pd.Timestamp(end).timestamp()])
    g = add_history_features(hourly_grid(s))
    g = g[g.valid & g.target_ok & (g.maintenance == 0)]
    g = add_static_features(g, stations, cities, capacity)
    return station_hour_profile(g)


def add_weather(g, wlookup):
    return g.merge(wlookup, on=["city_id", "hour_epoch"], how="left")


FEATURES = [
    "bikes_available_to_rent", "bikes", "booked_bikes", "free_racks", "free_special_racks", "free_total",
    "capacity", "fill", "since_change_h", "changes_1h", "changes_24h",
    "avail_lag1", "avail_lag2", "avail_lag3", "avail_lag24", "avail_lag168", "d1", "d3", "roll24_mean", "roll24_std",
    "next_d_yday", "next_d_lweek", "dev_from_profile",
    "hour", "dow", "weekend", "hour_sin", "hour_cos", "doy_sin", "doy_cos",
    "prof_avail", "prof_delta", "prof_absdelta",
    "station_cluster_cat", "city_cat",
    "temperature_2m", "precipitation", "wind_speed_10m",
]
CATEGORICAL = ["station_cluster_cat", "city_cat"]


def build_supervised(status_raw, stations, cities, capacity, profile, clusters, wlookup=None,
                     start=None, end=None, max_gap_h=168):
    """Raw status change log -> one row per (station, hour) with features and 1h-ahead target."""
    s = clean_status(status_raw)
    g = hourly_grid(s, max_gap_h=max_gap_h)
    g = add_history_features(g)
    keep = g.valid & g.target_ok & (g.maintenance == 0)
    if start is not None:
        keep &= g.hour_epoch * 3600 >= pd.Timestamp(start).timestamp()
    if end is not None:
        keep &= g.hour_epoch * 3600 < pd.Timestamp(end).timestamp()
    g = g[keep].drop(columns=["obs_idx", "last_obs_time", "valid", "target_ok"]).reset_index(drop=True)
    g["target"] = g["target"].astype("float32")
    g = add_static_features(g, stations, cities, capacity)
    g = g.merge(profile, on=["station_id", "hour", "weekend"], how="left")
    g["dev_from_profile"] = (g.bikes_available_to_rent - g.prof_avail).astype("float32")
    g = g.merge(clusters, on="station_id", how="left")
    g["station_cluster"] = g["station_cluster"].fillna(-1).astype("int16")
    if wlookup is not None:
        g = add_weather(g, wlookup)
    else:
        for v in WEATHER_VARS:
            g[v] = np.float32(np.nan)
    g["utc"] = pd.to_datetime(g.hour_epoch * 3600, unit="s")
    # pandas categoricals -> HistGradientBoosting native categorical splits (unknown city -> NaN)
    g["city_cat"] = pd.Categorical(g.city_id, categories=sorted(stations.city_id.unique()))
    g["station_cluster_cat"] = pd.Categorical(g.station_cluster, categories=sorted(clusters.station_cluster.unique()))
    return g


def save_json(obj, path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, indent=2, default=float))
