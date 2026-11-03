# Part A findings: what kinds of bike trips are there? (with the concepts explained)

> **AI-written study material (Claude).** This explains the results of `data_findings/ai/02b_trip_clustering_simple.ipynb` and the concepts behind them, so the team can understand them. **The challenge forbids AI-written text in the report and notebooks**, so use this to learn from and write the report in your own words. Interpretations marked *(suggested)* are for the team to confirm or reject.

**Question:** If we look only at *how* a trip is ridden, do bike-share trips fall into a few natural types?
**Data:** 1,161,376 trips in 185 European cities, Aug 2022 – Jul 2023 (cleaned in notebook 01).
**Approach:** 4 features per trip → standardise → PCA → KMeans → check quality and stability → describe the groups → link them to station types.

Each finding below has four parts:
- **Finding:** what we found.
- **Evidence:** the numbers or chart that show it.
- **Concept:** the idea you need to read the evidence.
- **Caveat:** what limits it.

---

## Finding 1: Trip measurements are very skewed, and one of them is almost redundant

**Evidence**
- Median trip: about 12 minutes and 1.35 km. The longest trips last 8 hours.
- Straight-line speed never exceeds 15.05 km/h. This is an upstream filter, not real behaviour.
- In the PCA (Finding 2), the 4th component carries only **1.3%** of the information.

**Concept: why we transform features before clustering**
- **Log transform.**
  - When most values are small and a few are huge (a "long tail"), the huge ones dominate any average or distance.
  - Taking the log compresses the tail and turns *ratios* into equal steps: 5→10 min becomes the same jump as 20→40 min.
  - That's why duration and distance are logged.
- **Standardisation (z-score)** = (value − mean) / standard deviation, so every feature has mean 0 and std 1.
  - KMeans groups trips by *distance* in feature space.
  - Without standardising, a feature with large numbers (such as speed, 0–15) would outweigh one with small numbers just because of its units.
- **Redundancy.** Speed = distance ÷ duration, so once you know two of them the third adds almost nothing new. PCA detects this automatically (the 1.3% component).

**Caveat:** distance is a **straight line** from start to end, not the real route. A ride that loops back looks short and slow.

---

## Finding 2: Trips vary along three main dimensions: size, speed and direction

**Evidence (PCA)**
| Component | Variance explained | Mostly made of | *(suggested)* meaning |
|---|---|---|---|
| PC1 | 41% | duration (0.82), distance (0.89) | **Trip size** |
| PC2 | 35% | speed (0.98), minus duration (−0.53) | **How fast / direct** |
| PC3 | 23% | radial movement (0.90) | **Direction**: into or out of the centre |
| PC4 | 1% | nothing new | redundancy (speed = distance ÷ time) |

The first 3 components keep **98.7%** of the information. We cluster on those 3.

**Concept: PCA (Principal Component Analysis), the "factorial analysis"**
- **What it does:** PCA builds new axes from combinations of the original features.
  - The first axis (PC1) points in the direction where trips differ the most.
  - The second captures the most of what is left, at a right angle to the first. And so on.
  - The new axes are uncorrelated with each other.
- **Explained variance:** the share of the total spread in the data that each component captures. With 4 standardised features the total "information" is 4 units. PC1 has an eigenvalue of 1.64, so it carries as much as 1.64 of the original features.
- **Scree plot:** the explained variance in order. You keep components until the curve flattens. Our rule was "keep enough to reach ≥ 90%".
- **Loading:** the correlation between an original feature and a component. Near ±1 means "this component basically *is* that feature". That's how we name the components.
- **Why do PCA before clustering?**
  1. It removes redundancy (PC4).
  2. It gives readable dimensions to explain the clusters with.
  3. It lets us plot the trips in 2D (PC1 vs PC2).

---

## Finding 3: Four groups describe the trips best

**Evidence**
| K (number of groups) | 2 | 3 | **4** | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|
| Silhouette | 0.28 | 0.30 | **0.34** | 0.28 | 0.29 | 0.28 | 0.27 |

**Concept: KMeans**
1. Choose K and place K centres.
2. Assign every trip to the nearest centre.
3. Move each centre to the average position of its trips.
4. Repeat steps 2–3 until nothing changes.

- **What it minimises:** *inertia*, the total squared distance from trips to their centre.
- **Several starts:** results depend on the starting centres, so it's run several times (`n_init`) and the best run is kept.

**Concept: choosing K**
- **Inertia / elbow:** inertia always drops when you add groups, so you look for the "elbow" where adding more stops helping much.
- **Silhouette:** for each trip, compare a = average distance to its own group with b = average distance to the nearest other group.
  - Score = (b − a) / max(a, b).
  - Near 1 means clearly in the right group, near 0 means on the border, negative means probably in the wrong group.
  - Rough guide: < 0.25 weak, 0.25–0.5 reasonable, > 0.5 strong.
- **Our 0.34** means the groups are real but *overlap at the edges*. Trips change gradually from one type to the next rather than in sharp jumps.

**Caveat:** the silhouette was computed on a 20,000-trip sample, because it compares every pair of trips and is too slow on 1.16 million.

---

## Finding 4: The groups are stable, not a fluke of the data

**Evidence:** two models fitted on two different random halves of the trips label all trips almost identically, with **ARI = 0.995**.

**Concept: ARI (Adjusted Rand Index)**
- **What it compares:** two groupings of the same items. For every pair of trips it asks: do both groupings agree on whether these two belong together?
- **Scale:** 1 = identical groupings, 0 = no better than random. The group *numbers* don't matter, only who is grouped with whom.
- **Why test stability:** if the groups changed whenever the data changed slightly, they would be artefacts of the algorithm, not real patterns.

---

## Finding 5: The four trip types

**Evidence**
| Group | Share | Median time | Median distance | Median speed | Start → end distance to centre | *(suggested)* name |
|---|---|---|---|---|---|---|
| 0 | **46%** | 8 min | 0.9 km | 7.2 km/h | 0.95 → 1.06 km | **Short hops** |
| 1 | 20% | 14 min | 2.2 km | 9.6 km/h | **2.62 → 1.15 km** | **Inbound** (towards the centre) |
| 2 | 18% | 18 min | 2.8 km | 9.7 km/h | **1.05 → 3.38 km** | **Outbound** (away from the centre) |
| 3 | 16% | **36 min** | 1.3 km | **2.2 km/h** | 1.41 → 1.51 km | **Slow / leisure** |

More detail on group 3: 10% of its trips last over 2 hours (90th percentile = 122 min), and 10% have a straight-line speed below 0.6 km/h.

*(Suggested reading)*
- **Short hops** are the typical bike-share use: almost half of all trips are short rides that stay at the same distance from the centre.
- **Inbound and outbound** trips mirror each other: longer, faster rides between the outskirts and the centre, such as commuting or errands.
- **Slow trips** are almost certainly not A→B rides. They are loops, sightseeing, or rides with stops, which the straight-line distance can't see.

**Concept: median vs mean.** We describe groups with the median (the middle value) because it isn't pulled up by a few extreme trips, such as the 8-hour ones.

**Concept: describe in original units.** Clustering happens on standardised PCA scores, which are hard to read. To explain a group, go back to minutes, km and km/h.

---

## Finding 6: The trip types are not about time of day

**Evidence**
- On weekdays all four groups peak at the same time, around **16–17 h** (start-hour chart, notebook 02b §7).
- Weekend trips are slightly more often slow trips: 20% at weekends vs 15% on weekdays.
- Short hops are a smaller share at weekends: 39% vs 48% on weekdays.
- Cramér's V between group and weekend = **0.08**, which is negligible.

**Concept: describing groups with variables we left out**
- Time, weekend, weather and e-bike were *not* used to form the groups. Checking them afterwards tests whether the groups *relate* to things they weren't built from.
- If a group differs strongly on such a variable, that's an independent clue to its meaning.

**Concept: χ² test and Cramér's V**
- **The setup:** build a table of group × variable (e.g. group × weekday/weekend).
- **χ² test:** asks whether the table is different from what you'd expect if the two were unrelated.
  - With a million trips, even tiny differences come out "significant" (p ≈ 0), so the p-value alone is useless here.
- **Cramér's V measures *how strong* the link is:** V = √(χ² / (n × (min(rows, columns) − 1))), from 0 (no link) to 1 (perfect).
  - Rough guide: < 0.1 negligible, 0.1–0.3 weak, > 0.3 moderate or strong.

---

## Finding 7: Bad weather and winter cut the slow trips most

**Evidence**
| Share of trips | Short hops | Inbound | Outbound | Slow |
|---|---|---|---|---|
| Cold or wet hour (< 8 °C or ≥ 0.5 mm rain) | **51.3%** | 19.7% | 16.3% | **12.7%** |
| Warm & dry hour (≥ 15 °C, < 0.1 mm) | 43.3% | 19.2% | 18.7% | **18.8%** |
| Winter (Dec–Feb) | 50.7% | 19.4% | 17.3% | 12.6% |
| Summer (Jun–Aug) | 43.9% | 19.5% | 18.4% | 18.2% |

Cramér's V: weather 0.06, month 0.05. Both are small, but the direction is consistent.

*(Suggested reading)* The trips people *need* (short hops, inbound) keep their share in bad weather. Leisure-like slow trips shrink by about a third, which fits the idea that group 3 is leisure riding.

**Caveat:** weather comes from the Open-Meteo archive at each *city's centre point*, hourly, not at each trip's exact location.

---

## Finding 8: E-bikes are used more for longer outbound trips

**Evidence:** **24%** of outbound trips are on e-bikes, compared with 13–16% in the other groups. Cramér's V = 0.11, weak.

*(Suggested reading)* Riding out of the centre often means longer distances and maybe hills, which is where electric assistance helps most.

**Caveat:** e-bike availability differs a lot between cities, so part of this could be a city effect rather than rider choice.

---

## Finding 9: Countries differ more than anything else

**Evidence:** Cramér's V of group vs country = **0.17**, the strongest of all the context variables.

| Country | Short hops | Inbound | Outbound | Slow |
|---|---|---|---|---|
| CZ | **71%** | 13% | 7% | 9% |
| DE | 53% | 18% | 16% | 13% |
| ES | 43% | 14% | **27%** | 16% |
| GB | **19%** | **34%** | **33%** | 14% |
| PL | 41% | 22% | 14% | **24%** |

*(Suggested reading)* The kind of trip depends heavily on the city system: its size, layout, and where its stations are.

**Caveat:** trips are concentrated in a few cities (Gini = 0.617 in notebook 01), so one country can be essentially one big system. Compare cities, not countries, before generalising.

---

## Finding 10: Trip types match the type of station they start from

**Evidence:** each trip gets the cluster of its start station (station clusters come from notebook 03; 85% of trips can be linked).

| Start station type *(names suggested)* | Short hops | Inbound | Outbound | Slow |
|---|---|---|---|---|
| Suburban stations | 0.21 | **2.15** | 1.54 | 1.33 |
| Quiet docked stations | 0.80 | 1.44 | 0.89 | 1.17 |
| Virtual, empty in the morning | 1.16 | 1.05 | 0.66 | 0.85 |
| Virtual, fill during the day | 1.26 | 0.88 | 0.73 | 0.69 |
| Big busy hubs | 0.97 | 0.85 | **1.17** | 1.07 |

Cramér's V = 0.12, weak but consistent.

**Concept: lift**
- **Definition:** lift = (share of a trip type among trips from this station type) ÷ (share of that trip type overall).
- **Reading it:** 1 = no difference, 2 = twice as common as usual, 0.5 = half as common.
- **Example:** suburban stations start **2.15×** more inbound trips and only 0.21× as many short hops. That makes sense, because from the suburbs the obvious ride is into town.

**Why this matters:** station types come mainly from the *station status log* (how full stations are over the day), while trip types come from the *trip file*. Two independent sources telling a consistent story support both analyses.

---

## Limitations to state in the report
1. **Straight-line distance only.** Loop rides look slow, so group 3 depends on this.
2. **The trip file was filtered before we got it:** 2 min – 8 h, 50 m – 20 km, speed ≤ 15 km/h. By our estimate in notebook 01 it is also only about 70% of real departures.
3. **The groups overlap at the edges** (silhouette 0.34). They are types along a continuum, not perfectly separate categories.
4. **Big systems dominate.** Cities with many trips shape the groups the most.
5. **Weather is at city level, hourly**, not at each trip's location.

## Where the evidence is (notebook 02b)
| Finding | Section of the notebook |
|---|---|
| 1 | §1 feature histograms and table |
| 2 | §3 scree plot and loadings |
| 3 | §4 elbow and silhouette |
| 4 | §5 stability check |
| 5 | §6 profile table (incl. distance to centre and 90th-percentile duration) and scatter plots |
| 6–9 | §7 start-hour chart, context table, weather / season / weekend tables, country table, Cramér's V table |
| 10 | §8 lift heatmap (the "quiet docked" row is in the notebook heatmap) |
