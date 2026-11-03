# Catch-up notes: Unsupervised Part A (trip clustering)

> **AI-written meeting and study notes (Claude).** These are for understanding the method and preparing the team discussion only. Do not copy them into the report or notebook annotations; the brief bans AI-written text there. Numbers come from `data_findings/ai/02_trip_clustering.ipynb` (plus a few from 01 and 03). Cluster labels and readings are suggestions to argue about, not conclusions.

---

## 0. The pipeline at a glance

```
trips_clean.pkl (notebook 01: local time, weather, flags)
   │
   ├─ 1. build 8 numeric features per trip
   ├─ 2. standardise (z-scores)
   ├─ 3. PCA ─────────────────────── used to UNDERSTAND the features (not fed to KMeans)
   ├─ 4. KMeans for k = 2..10 ────── score each k: inertia, silhouette, DB, CH
   │      + bootstrap stability, GMM-BIC, Ward → pick K = 6
   ├─ 5. final KMeans K = 6, relabel clusters 0..5 by mean duration
   ├─ 6. describe clusters with the ORIGINAL units + variables not used in clustering
   ├─ 7. sensitivity run without time features
   └─ 8. save trip_clusters.pkl → crossed with station clusters in notebook 03
```

The brief asks for "factorial analysis + clustering + evaluation". In our pipeline:
- Factorial analysis = step 3.
- Clustering = steps 4–5.
- Evaluation = steps 4, 6 and 7.

---

## 1. The data going in (from notebook 01)

| Fact | Why it matters for clustering |
|---|---|
| 1,161,376 trips, 185 cities, Aug 2022 – Jul 2023 | Big enough for KMeans on everything. Some metrics have to be computed on samples (see §4) |
| **The sample was filtered before we got it**: duration 2 min – 8 h, distance 50 m – 20 km, straight-line speed ≤ 15.05 km/h | We can't "find outliers": they were removed before we got the data |
| 96.9% of durations are whole minutes | Duration is coarse for very short trips (an 8-minute trip could be 7.5–8.5) |
| No trip starts and ends at the same station; distance is a **straight line** between start and end | A ride that loops back looks slow and short. That's what cluster 5 is |
| 7.7% of starts and 10.5% of ends are free-floating (no station) | Used to describe the clusters, not as a feature |
| Trips are concentrated in a few cities (Gini 0.617) | Big cities shape the clusters more than small ones |
| Timestamps converted from UTC to **local** time per city (`cities.timezone`, function `bc.local_time`) | "8 am" means 8 am locally in every country |
| Hourly weather (Open-Meteo) joined per trip | Used to describe the clusters, not as a feature |

---

## 2. Features: what each one is and why it's transformed

KMeans measures similarity with **Euclidean distance**: two trips are "similar" if their feature vectors are close. So each feature has to be on a scale where a "distance" means something.

| Feature | How it's computed | Why this form |
|---|---|---|
| `log_duration` | log(duration in minutes) | Duration is very right-skewed (most trips ~10 min, a few ~8 h). The log stops long trips from dominating and makes *ratios* count: 5→10 min is as big a step as 20→40 min |
| `log_distance` | log(distance in metres) | Same reason |
| `speed_kmh` | distance ÷ duration × 3.6 | Separates fast A→B trips from slow ones |
| `hour_sin`, `hour_cos` | angle = 2π·hour/24; take sin and cos | **Cyclical encoding.** Raw hour puts 23 h and 0 h 23 units apart, though they're neighbours. On the unit circle every hour is a point and 23 h sits next to 0 h. Two numbers are needed to place a point on a circle |
| `weekend` | 1 if Saturday or Sunday (local) | Weekend and weekday riding are different |
| `centrality_start` | −log((d_start + 0.1) / (city median d_start + 0.1)), with d = distance to city centre in km | **Relative to each city.** 1 km from the centre means "central" in a big city but not in a village. Positive = starts closer to the centre than the city's typical trip. The log makes it a ratio; +0.1 avoids log(0) |
| `radial_km` | d_end − d_start, clipped to ±10 km | Direction of travel. Negative = heading **into** the centre, positive = heading **out** |

The code is in notebook 02 §1. The sin/cos and calendar columns come from `bc.add_calendar` in `bikeshare_common.py`.

**Standardisation** (`StandardScaler`): each feature is rescaled to z = (x − mean) / std, so every feature has mean 0 and standard deviation 1.
- **Why:** without it, a feature measured in big units would dominate the distance just because of its units.
- **Side effect to know:** `weekend` is 0/1 with 23% ones. After standardising, weekday = −0.55 and weekend = +1.83, a 2.4-std jump. That's a huge gap compared with the continuous features, so KMeans almost certainly puts weekend trips in their own cluster. That is why cluster 2 is 100% weekend.

**Left out on purpose** (used only to *describe* the clusters later): e-bike, free-floating, weather, month. Cargo was dropped because it's always 0.
- Rationale: the clusters describe *how* a trip is ridden (length, speed, time, geography). Context variables are then checked to see whether they *explain* the clusters.
- → *Discuss:* do we agree?

Correlations between features: duration–distance 0.57, speed–duration −0.43, speed–distance 0.42, centrality–radial 0.42. Everything else is close to 0.

---

## 3. Factorial analysis: PCA

### How PCA works
- **It looks for new axes** (principal components, PCs) that are linear combinations of the 8 standardised features.
  - PC1 is the direction along which the trips vary the most.
  - PC2 is the direction of largest remaining variance, perpendicular to PC1. And so on.
  - The PCs are uncorrelated with each other.
- **On standardised data this is the eigen-decomposition of the correlation matrix.**
- **Eigenvalue = how much variance a PC carries, measured in "variables".** With 8 standardised variables the total variance is 8. An eigenvalue of 1.66 means the component carries as much information as 1.66 of the original variables.
- **Kaiser rule: keep PCs with eigenvalue > 1.** These are components that summarise more than a single original variable would.
- **Scree plot = eigenvalues (or % variance) in order.** You look for where the curve flattens.

### Results
| | PC1 | PC2 | PC3 | PC4 | PC5 | PC6 | PC7 | PC8 |
|---|---|---|---|---|---|---|---|---|
| Eigenvalue | 1.66 | 1.41 | 1.41 | 1.23 | 0.94 | 0.79 | 0.50 | 0.05 |
| Cumulative % | 21% | 39% | 56% | 72% | 83% | 93% | 99% | 100% |

- Kaiser keeps 4 PCs (72% of the variance).
- **No dominant component.** Variance is spread fairly evenly, so the trips have no simple low-dimensional structure.
- **PC8 is almost zero (0.6%)** because speed ≈ distance ÷ duration. Once you know two of the three, the third is nearly determined (not exactly, since speed isn't on a log scale).

### Loadings: what each PC means
A **loading** = component weight × √eigenvalue. On standardised data this equals the **correlation between the original variable and the PC**. A loading near ±1 means the PC is basically that variable.

| | PC1 | PC2 | PC3 | PC4 | PC5 |
|---|---|---|---|---|---|
| log_duration | **0.84** | −0.37 | −0.30 | −0.10 | −0.15 |
| log_distance | **0.86** | 0.46 | −0.05 | −0.03 | −0.06 |
| speed_kmh | 0.01 | **0.94** | 0.29 | 0.06 | 0.10 |
| hour_sin | −0.04 | 0.10 | 0.07 | **−0.72** | 0.33 |
| hour_cos | 0.02 | 0.07 | 0.05 | **0.76** | −0.12 |
| weekend | 0.22 | −0.15 | −0.12 | 0.35 | **0.88** |
| centrality_start | 0.02 | −0.36 | **0.80** | 0.02 | 0.03 |
| radial_km | 0.41 | −0.13 | **0.76** | −0.01 | −0.02 |

Suggested reading:
- **PC1 = trip size.** Long and far vs short and near.
- **PC2 = speed.** Direct fast trips vs slow ones, which load on duration (−0.37).
- **PC3 = geography.** Starts centrally *and* moves outward vs starts on the outskirts and moves inward.
- **PC4 = time of day.** sin has −0.72 and cos +0.76:
  - At 9 am the angle is 135° (sin +0.71, cos −0.71), so PC4 is strongly negative.
  - At 9 pm the angle is 315° (sin −0.71, cos +0.71), so PC4 is strongly positive.
  - So PC4 runs from morning (−) to evening/night (+).
- **PC5 = weekend.**

### Correlation circle (the charts in §2 of the notebook)
- Each variable is an arrow whose coordinates are its loadings on two PCs.
- **Arrow length near the circle** means the variable is well represented in that plane. A short arrow means it lives mostly in other PCs.
- **Arrows pointing the same way** are positively correlated, **opposite** arrows are negatively correlated, and **perpendicular** arrows are uncorrelated.

### Important design point
**KMeans runs on the 8 standardised features, not on the PC scores.** Here PCA is only used to understand the feature space and to plot the clusters (PC1–PC2 scatter).
- Clustering on all 8 PCs would give the *same* result as on the 8 features, because PCA is only a rotation and keeps the distances.
- Clustering on the first 4–5 PCs would drop some noise and make the "factorial analysis → clustering" pipeline explicit.
- → *Discuss:* switch to clustering on 4–5 PCs? That's what notebook 03 does for stations.

---

## 4. Clustering and choosing K

### KMeans: how it works
1. Pick K starting centres. sklearn uses *k-means++*, which spreads the starting centres apart.
2. Assign every trip to its nearest centre.
3. Move each centre to the mean of its trips.
4. Repeat steps 2–3 until nothing changes.

- **What it minimises:** *inertia*, the sum of squared distances from each trip to its centre.
- **Local minimum:** it can get stuck in one, so it's run `n_init` times from different starts and the best run is kept. We use 5 runs for the k scan and 10 for the final model. `random_state` fixes the randomness so results can be reproduced.
- **Assumptions:** roughly round clusters of similar spread. Every trip *must* belong to a cluster.
- **Boundaries between clusters are straight cuts** (hyperplanes halfway between centres). This matters for clusters 0 and 1 (see §5).

### How each k is scored
| Metric | Definition | Read as |
|---|---|---|
| **Inertia** (elbow) | Within-cluster sum of squared distances | Always falls as k grows. Look for the "elbow" where gains slow down |
| **Silhouette** | Per trip: a = mean distance to its own cluster, b = mean distance to the nearest *other* cluster; s = (b − a) / max(a, b); then averaged | Range −1..1. Common rule of thumb: > 0.5 strong structure, 0.25–0.5 weak, < 0.25 no substantial structure. Costs O(n²), so computed on a 30k sample |
| **Davies–Bouldin** | For each cluster, the worst ratio of (spread_i + spread_j) / distance between centres i and j, then averaged | **Lower is better**. Compact, well-separated clusters |
| **Calinski–Harabasz** | Between-cluster dispersion ÷ within-cluster dispersion, adjusted for n and k | **Higher is better** |

### Stability (bootstrap + ARI)
- **The question:** if the clusters are real, a different sample of trips should give the same partition.
- **Procedure:** draw 300k trips with replacement, fit KMeans, and label a *fixed* reference set of 50k trips. Repeat 8 times. Compare every pair of labelings (28 pairs).
- **Comparison measure: Adjusted Rand Index (ARI).** For every *pair of trips* it checks whether both labelings agree on "same cluster" vs "different cluster".
  - It is adjusted so that random labels score 0 and identical partitions score 1.
  - The cluster *numbers* don't matter, only the grouping.

### Results
| k | silhouette | Davies–Bouldin ↓ | Calinski–Harabasz ↑ | smallest cluster | bootstrap ARI (mean / min) |
|---|---|---|---|---|---|
| 4 | 0.155 | 1.83 | 4488 | 15.6% | 0.571 / 0.339 |
| 5 | 0.163 | 1.65 | 4501 | 12.6% | 0.943 / 0.873 |
| **6** | **0.169** | 1.51 | **4557** | 11.3% | **0.989 / 0.983** |
| 7 | 0.155 | **1.49** | 4310 | 10.7% | 0.979 / 0.967 |
| 8 | 0.167 | 1.56 | 4074 | 9.0% | 0.978 / 0.966 |

- **K = 6:** best silhouette, best CH, second-best DB, and almost perfect stability (ARI 0.99).
- **k = 4 is unstable (ARI as low as 0.34).** There are at least two equally good ways to split into 4, and the sample decides which one you get. That's a sign k = 4 is the "wrong" number.
- **The silhouette is low for every k (~0.15–0.17).** Trips are a *continuum*: KMeans finds the same cut every time (stable), but the regions it cuts aren't separated by gaps. The report should say this openly.

### Alternatives used as cross-checks
- **Gaussian Mixture Model (GMM):**
  - Each cluster is a Gaussian "blob" with its own covariance, so it can be an ellipse of any shape or orientation. Each trip gets a *probability* of belonging to each cluster (soft clustering).
  - It is fitted with the EM algorithm.
  - Model choice uses **BIC = −2·log-likelihood + (number of parameters)·log(n)**; lower is better. The penalty matters here: a full covariance in 8D adds 8 means + 36 covariances *per cluster*.
  - **Our BIC curve is erratic.** It drops at 5, jumps at 6–7 and falls sharply at 8.
  - *Guess, to verify:* a GMM component made only of weekend trips has zero variance in `weekend`. That lets the likelihood shoot up (a near-degenerate Gaussian), so BIC is unreliable with binary features. Don't use it to pick K.
- **Ward hierarchical clustering:**
  - It starts with every trip as its own cluster and repeatedly merges the pair whose merge increases within-cluster variance the least.
  - It has the same objective as KMeans but builds a tree (dendrogram) greedily.
  - Memory is O(n²), so it was run on a 15k sample.
- **Agreement at K = 6 (15k sample):** ARI 0.43 vs Ward and 0.40 vs GMM.
  - So the partition depends partly on the algorithm, which fits the low silhouette. When there are no clear gaps, each method draws the boundaries in its own place.

Also: MiniBatchKMeans (a faster approximation) was tried first and was unstable (ARI ~0.56), so full KMeans is used. That run isn't in the notebook.

After fitting, the cluster numbers are arbitrary, so they're **relabelled 0..5 by mean trip duration** to make them reproducible and readable.

---

## 5. The 6 clusters

### How they're described
- **Profile table:** medians and shares in *original units* (minutes, km, % weekend). This is the readable version.
- **Centroid heatmap:** the mean z-score of each feature per cluster. 0 = the average trip, +1 = one std above average. This shows what *separates* the clusters.
- **Start-hour curves, scatter plots and the monthly mix:** visual checks.

### Profile (ids ordered by mean duration)
| | share | median min | median km | median km/h | weekend | when (local) | start dist. to centre | radial km | e-bike |
|---|---|---|---|---|---|---|---|---|---|
| **0** | 22.7% | 8 | 1.0 | 7.6 | 0% | 45% at 6–9 h, 51% at 10–15 h, **0% at 16–19 h** | 1.0 km | +0.1 | 12% |
| **1** | 24.3% | 9 | 1.1 | 7.4 | 0% | **0% at 6–9 h**, 57% at 16–19 h, 31% at 20–5 h | 1.0 km | +0.1 | 15% |
| **2** | 16.5% | 11 | 1.3 | 7.2 | **100%** | spread out, 29% at 20–5 h | 1.3 km | +0.1 | 14% |
| **3** | 12.9% | 17 | 2.7 | 9.7 | 13% | mixed | **3.2 km** | **−1.8** | 17% |
| **4** | 12.2% | 20 | 3.2 | 10.0 | 18% | mixed | 1.0 km | **+2.5** | **25%** |
| **5** | 11.3% | **51** | 1.4 | **1.6** | 22% | mixed | 1.5 km | +0.1 | 15% |

90th-percentile duration: 14 / 16 / 23 / 34 / 47 / **147** min.

Possible labels (only prompts):
- **0:** short weekday trips, morning to midday.
- **1:** short weekday trips, late afternoon to night.
- **2:** short weekend trips.
- **3:** longer, faster trips from the outskirts **into** the centre.
- **4:** longer, faster trips from the centre **outwards**. Highest e-bike share.
- **5:** "slow" trips: long time but short straight-line distance. Likely loops or stopovers, since we can't see the route.

### Two things to understand about this result
1. **Clusters 0 and 1 are split by the clock at about 16 h.**
   - Short weekday trips are one big dense mass spread around the hour circle.
   - KMeans must cut it somewhere, and its boundaries are straight lines, so it slices the circle into a "before ~16 h" half and an "after ~16 h" half.
   - This is a property of the method plus the cyclical encoding, not proof of two separate trip types.
2. **Clusters 2–5 each come from one strong feature.**
   - 2 = weekend: the big standardised gap explained in §2.
   - 3 and 4 = the sign of `radial_km` together with longer distance.
   - 5 = low speed with long duration.
   - These "shape" clusters are the more meaningful result.

---

## 6. Checking the clusters against context (variables not used in clustering)

### Method: χ² test and Cramér's V
- **The setup:** build a table of cluster × context variable (e.g. cluster × country).
- **χ² test of independence:** asks whether the table is different from what you'd expect if the two variables were unrelated.
  - With 1M trips, *anything* comes out significant (p ≈ 0), so the p-value is useless here.
- **Cramér's V measures the strength:** V = √(χ² / (n · (min(rows, cols) − 1))). 0 = no association, 1 = perfect.
  - Rough guide: < 0.1 negligible, 0.1–0.3 weak, > 0.3 moderate or strong.

### Results
- **Cramér's V:** country 0.12, e-bike 0.10, weather 0.09, month 0.05, free start/end 0.04. All weak: context *shifts* the mix but doesn't define the clusters.
- **Season** (share of each cluster per month):
  - Cluster 0 is 28–29% in Nov–Jan and 15–19% in Aug/Jul.
  - Clusters 2 and 5 are higher in summer: cluster 2 is 23% in Aug and 21% in Jul; cluster 5 is 13% in Aug and 8% in Jan.
- **Weather** (share of trips in each cluster under each condition):

  | | 0 | 1 | 2 | 3 | 4 | 5 |
  |---|---|---|---|---|---|---|
  | cold or wet | **30.6%** | 22.8% | 14.3% | 12.1% | 11.3% | 8.8% |
  | warm & dry | 17.2% | 25.7% | 18.2% | 13.1% | 13.0% | **12.9%** |

  - "Cold or wet" = below 8 °C or ≥ 0.5 mm of rain in that hour. "Warm & dry" = at least 15 °C and under 0.1 mm.
  - In bad weather the mix shifts towards short daytime weekday trips and away from slow or leisure trips.
- **Country:**
  - GB is very different: 27% in cluster 3 and 27% in cluster 4, so mostly long radial trips.
  - CZ has almost none: 8% in cluster 3 and 3% in cluster 4.
  - ES leans outward (19% in cluster 4).

---

## 7. Sensitivity check: cluster without hour and weekend

**Why:** to see how much of the result is driven by the time features. Re-run KMeans on only the 5 "shape" features (duration, distance, speed, centrality, radial).

| k | silhouette | ARI vs main K = 6 |
|---|---|---|
| 3 | 0.246 | 0.24 |
| **4** | **0.264** | 0.32 |
| 6 | 0.224 | 0.28 |

- **Without time, the clusters are better separated** (silhouette 0.26 vs 0.17): the time features add a lot of "continuum".
- **The two solutions share little** (ARI ≈ 0.3). The time features change the partition a lot.
- → *Discuss:* present two clusterings, one for trip **shape** and one for trip **timing**, instead of one mixed clustering? It's cleaner to explain and could be a strong point in the report.

---

## 8. Link to Part B (station clusters, notebook 03 §7)

### Method
- **The question:** does the *type of start station* predict the *type of trip*?
- **Mapping:** each trip gets its start station's cluster. 85% of trips start at a clustered station.
- **Crosstab:** station cluster × trip cluster, with χ² and Cramér's V (as in §6).
- **Lift** = P(trip cluster | start station cluster) ÷ P(trip cluster overall).
  - 1 = no association, 2 = twice as common as usual, 0.5 = half as common.

### Results
- χ² = 66,070, p ≈ 0, **Cramér's V = 0.13**. The association is real but weak.

| start station cluster ↓ / trip cluster → | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 0 (suburban, long trips) | 0.22 | 0.27 | 0.67 | **3.09** | 1.87 | 1.55 |
| 1 (quiet docked) | 0.70 | 0.87 | 1.16 | 1.61 | 0.87 | 1.14 |
| 2 (virtual, empties in the morning) | **1.53** | 0.76 | 0.98 | 1.00 | 0.64 | 0.86 |
| 3 (virtual, fills during the day) | 1.03 | **1.43** | 0.78 | 0.91 | 0.72 | 0.72 |
| 4 (large busy hubs) | 0.96 | 1.02 | 1.04 | 0.77 | 1.17 | 1.05 |

(Station-cluster names are also only prompts.)
- **The two analyses agree**, even though they were built from different data:
  - Suburban stations start 3× more trips into the centre.
  - Stations that empty in the morning start more morning trips.
  - Stations that fill during the day start more evening trips.
- **Why that matters:** station clusters come mostly from the *status log* (fill curves), trip clusters from the *trip file*. Agreement between independent sources supports both.

---

## 9. Weaknesses to be upfront about
1. **Low silhouette (0.17).** The clusters are stable regions of a continuum, not separate groups.
2. **The weekday morning/evening split (clusters 0 and 1)** comes from the hour features plus KMeans's straight-line boundaries.
3. **The binary `weekend` feature** gets a large weight after standardisation and forces its own cluster. It also breaks the GMM-BIC comparison.
4. **Straight-line distance** makes loop rides look slow (cluster 5). We have no route data.
5. **The trip sample was filtered upstream**, and is about 70% of real departures by our estimate in 01.
6. **Big cities and countries weigh more.** There's no per-city weighting beyond `centrality_start`.
7. **Silhouette, Ward and GMM ran on samples** (15k–150k), not on all trips.

## 10. Decisions for the meeting
- [ ] Keep K = 6, or present K = 5 and K = 6 side by side?
- [ ] Cluster on the standardised features (current) or on the first 4–5 PCs, as notebook 03 does?
- [ ] Keep the time features in, or split into a "shape" clustering and a "timing" clustering?
- [ ] Down-weight `weekend` (e.g. scale it by 0.5) or keep it?
- [ ] Add e-bike or weather as features, or keep them as descriptors?
- [ ] Who writes which part of the report? The text must be ours.
- [ ] Which charts go in the report? See below.

## 11. Where things are
| Notebook 02 section | Charts and tables | Main sklearn / scipy calls |
|---|---|---|
| 1. Features | Correlation heatmap of the 8 features | `StandardScaler` |
| 2. PCA | Scree plot, loadings heatmap, correlation circles PC1–PC2 and PC3–PC4 | `PCA` |
| 3. Choosing K | Elbow, silhouette and DB curves; bootstrap ARI table; GMM BIC curve; Ward/GMM ARI | `KMeans`, `silhouette_score`, `davies_bouldin_score`, `calinski_harabasz_score`, `adjusted_rand_score`, `GaussianMixture`, `AgglomerativeClustering` |
| 4. Profiles | Profile table, centroid heatmap, start-hour curves, distance–duration and PC1–PC2 scatter, monthly mix, weather table, country heatmap, Cramér's V | `chi2_contingency` (scipy) |
| 5. Sensitivity | Table without time features | `KMeans` |
| Notebook 03 §7 | Mix and lift heatmaps, origin–destination matrix | `chi2_contingency` |

Shared helpers (`local_time`, `add_calendar`, `haversine_m`) are in `data_findings/ai/bikeshare_common.py`.
