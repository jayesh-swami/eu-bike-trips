# Part A, simple version: grouping bike trips

> **AI-written study and meeting notes (Claude).** Don't copy this text into the report or notebooks. Numbers come from `data_findings/ai/02b_trip_clustering_simple.ipynb`.

## The idea in one sentence
We describe every trip with 4 numbers, let an algorithm (KMeans) put similar trips into groups, then check whether the groups are good and what they mean.

---

## Step 1: Describe each trip with 4 numbers
| Feature | What it is |
|---|---|
| duration | How long the trip took (minutes) |
| distance | Straight-line distance from start to end |
| speed | distance ÷ duration (km/h) |
| radial | Distance to the city centre at the end minus at the start. **Negative = rode towards the centre, positive = rode away** |

- **Duration and distance are logged.** Most trips are short and a few are very long, and the log stops the long ones from dominating.
- **Time of day, weekend, e-bike and weather are *not* used to build the groups.** We use them afterwards to *describe* the groups. This keeps the groups about the *kind* of ride.

## Step 2: Standardise
Each feature is rescaled to mean 0 and standard deviation 1.
- **Why:** KMeans measures how "far apart" two trips are. Without this, a feature with big numbers (such as speed) would count more than one with small numbers, just because of its units.

## Step 3: PCA (the "factorial analysis" part)
PCA builds new summary axes (components) from the 4 features, ordered from most to least informative.

| | PC1 | PC2 | PC3 | PC4 |
|---|---|---|---|---|
| Variance explained | 41% | 35% | 23% | 1% |
| Mostly made of | duration + distance → **trip size** | speed → **how fast** | radial → **direction** (in vs out) | nothing new |

- **PC4 adds almost nothing**, because speed is basically distance ÷ duration. Once you know two of them, you know the third.
- **We keep 3 components (99% of the information) and cluster on them.**
- **Loadings table in the notebook:** each number is the correlation between a feature and a component. Close to ±1 means "this component *is* that feature".

## Step 4: How many groups? (K)
KMeans needs K, the number of groups, in advance. We tried K = 2 to 8 and looked at:
- **Inertia (the elbow plot).** How tightly trips sit around their group centre. It always goes down as K grows, so you look for the bend.
- **Silhouette.** For each trip, is it much closer to its own group than to the next nearest group?
  - The scale runs from −1 to 1, and higher is better.
  - Rough guide: below 0.25 is weak, 0.25–0.5 is reasonable, above 0.5 is strong.

| K | 2 | 3 | **4** | 5 | 6 |
|---|---|---|---|---|---|
| Silhouette | 0.28 | 0.30 | **0.34** | 0.28 | 0.29 |

→ **K = 4** has the best silhouette.

## Step 5: KMeans and checking the groups are real
**How KMeans works:**
1. Place 4 centres.
2. Give every trip to its nearest centre.
3. Move each centre to the average of its trips.
4. Repeat steps 2–3 until nothing changes.

**Stability check:**
- We split the trips into two random halves and ran KMeans on each half.
- Then we compared how both models label all trips, using the **ARI** (1 = identical grouping, 0 = random).
- **The result is 0.995**, so the groups don't depend on which trips we happened to use.

## Step 6: The 4 groups
| Group | Share | Median time | Median distance | Median speed | Direction | Possible name (to discuss) |
|---|---|---|---|---|---|---|
| 0 | 46% | 8 min | 0.9 km | 7.2 km/h | none | Short hops |
| 1 | 20% | 14 min | 2.2 km | 9.6 km/h | **1.4 km towards the centre** | Inbound trips |
| 2 | 18% | 18 min | 2.8 km | 9.7 km/h | **2.0 km away from the centre** | Outbound trips |
| 3 | 16% | 36 min | 1.3 km | 2.2 km/h | none | Slow / leisure trips (long time, short straight-line distance, probably loops) |

**Describing the groups with the variables we left out:**
- **Outbound trips have the most e-bikes:** 24%, vs 13–16% in the other groups.
- **Weekend share rises from short hops to slow trips:** 20% for short hops, 28% for slow trips.
- **Slow trips happen on slightly warmer days:** 15.5 °C on average vs 14.0 °C for short hops.
- **Time of day hardly differs between groups.** All four peak around 16–17 h on weekdays. So *when* a trip happens doesn't tell you much about *what kind* of trip it is.

## Step 7: Link with station groups (Part B)
- **We give each trip the group of its start station** (from notebook 03).
- **Lift** = how much more common a trip group is at that kind of station than overall. 1 means no difference.

| Start station group | Short hops | Inbound | Outbound | Slow |
|---|---|---|---|---|
| Suburban stations | 0.21 | **2.15** | 1.54 | 1.33 |
| Virtual, empty in the morning | 1.16 | 1.05 | 0.66 | 0.85 |
| Virtual, fill during the day | 1.26 | 0.88 | 0.73 | 0.69 |
| Big busy hubs | 0.97 | 0.85 | **1.17** | 1.07 |

- **It makes sense:** suburban stations start twice as many inbound trips, and big central hubs start more outbound ones.
- **The link is weak overall** (Cramér's V = 0.12; 0 = no link, 1 = perfect), but it points the right way.

---

## How this compares with the detailed version (notebook 02)
- **The simple version finds the same structure.** Its groups 1, 2 and 3 match the detailed clusters 3, 4 and 5 almost exactly (89–99% overlap).
- **The difference is in the short trips.** The detailed version *also* used time of day, so it split them into three: weekday morning, weekday evening and weekend.
- **The simple version has cleaner groups** (silhouette 0.34 vs 0.17) and is easier to explain.

## Words to know
- **Standardise:** rescale so every feature has mean 0 and standard deviation 1.
- **PCA:** combine correlated features into a few uncorrelated summary axes.
- **Loading:** the correlation between a feature and a PCA component.
- **KMeans:** groups points around K centres.
- **Inertia:** total squared distance of points to their group centre.
- **Silhouette:** how well each point fits its own group compared with the next nearest group.
- **ARI:** agreement between two groupings (1 = same, 0 = random).
- **Cramér's V:** strength of the link between two categorical variables (0 to 1).
- **Lift:** how much more often something happens in a subgroup than overall.

## Questions for the team
- [ ] Use the simple version (4 groups) in the report, the detailed one (6 groups), or both?
- [ ] Do the group names make sense to us?
- [ ] Who explains which step in the report?
