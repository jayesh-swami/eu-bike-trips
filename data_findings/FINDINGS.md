# Document to share the findings of the initial analysis

Summarised the cleanup in the beggining and later followed with the raw findings below.

## Data Cleanup Steps

### Bike Types
- 30 bike types (1050 bikes in total) with missing name, desc, range etc. filled with this ->
    - Added a column called `type_info_missing` stating whether the info was missing or not
    - Set the propulsion type as `unknown` and added a separate column `propulsion_filled` with `human` for all of these as none of these bikes have battery data in the trips
    - Filled in the `rider_capacity` as `1` to be treated as a default bike
- Set the battery capacity and range as `0` for human powered bikes. Both the backfilled and original ones.
- The electric bikes that have missing range and battery info but have the battery info mentioned in the description (or having similar description) of the bike have been filled in on a case by case basis.

## Bikes

Could not really find anything to do here. Just to keep in mind ->

- There are a lot of bikes with `0` as `computer_id` so maybe their data in trips is to be taken with a grain of salt. But these bikes have around 207k trips (18% of all trips) so we can't just ignore them either.
- There are multiple bikes with shared `computer_id`

## Trips



## Dataset Findings

### Bike Types

- A total of 121 different bike types
- 30 bikes have missing name, desc, range, propulsioon type, battery cap
- 22 bike types have battery capacity but only 15 have max range, so would need to fill in the values.
- Only 10 bike types have all the information
- There are 27 electric bikes and 64 human but only 22 have battery capacity maybe, we need to check this too
    - max_range           12
    - battery_capacity     5
- Not all bike types have descriptions but i guess that is fine
- All bikes that have battery capacity have electric assist type so thats good (same for max_capacity)
- `bike_types['name'].dropna().unique()` -> There are only 46 unique bike name and even between them there are similarities like 'e-CARGObike' and 'e-Cargobike'.
- Some bikes seem to be the same but just with different advert banner in images. Is it worth it to put them as a same bike? (It would require going through the images and stuff)
- There are 51 bike descriptions and 41 unique ones (including nan), maybe it is worth combining those?
- Okay so there are no bikes that have propulsion type as null and have battery stats in trips so maybe they are all human powered
- Based on form-factor -> 91 bikes have non null values -> 71 bicycles, 19 cargo and 1 other
- There is an bike type called "Unknown" which is ID 0 and human propelled, maybe the bikes with no data can be merged into that type

#### Things to fix
- Add an average or median values to the missing battery capacity and max range
- Add a separate column that would help us create cluster of similar bikes (based on propulsion type, rider cap, form factor, battery capacity, max range) as this might help to make more sense of the data (Maybe we can run a k means to find clusters within bike types?)
- Should we do something about the same/similar bikes (maybe cluster would help here too)
- For the bikes that do not have any battery data, is it safe to assume that they are human powered?
- Exclude the bike with 30 missing or mark the values as unknown and do a separate analysis with them!

### Bikes

- `bikes.isna().sum()` returns 0 - best case scenario - no nulls anywhere but need to check as there are some 0 values instead of na maybe
- All the bike type IDs in here have a corresponding entry in bike_types table so good.
- There are 5856 electric and 81530 human propelled bikes
- `bikes.query("computer_id == 0 & propulsion_type == 'electric_assist'")` 100 electric bikes with no computer IDs and 13136 in total.
- computer_id is not unique, 2878 computers are shared at least in 2 different bikes (2879 was counting `0` as a shared computer too) but not sure if we even do something about this

### Trips

- All trips have `time_start`, `duration`, `lat`, `lon` data.
- 
- There are 302 trips with battery data for human propelled bikes (8 bikes). These bikes have 405 trips in total, the other 103 are from bike 31742 before it started having battery data. Only bike with ID 31742 has trips with actual battery usage. The rest can be made NaN for both battery end and start, same as all the other human bike trips.
- 11875 trips for e bikes with missing battery data out of a total of 180091 trips
- There are some cities with no trip data

#### Things to fix

- Mark the `battery_start` and `battery_end` for `bike_ids` in `[71577, 88709, 88710, 89444, 531405, 600171, 600579]` as `NaN` (the rest of the human bike trips already have NaN so this keeps it consistent).

### Cities

- There are some cities which are duplicated (similar name) and some of them have no trips attached to them. But since the names are names of scheme and not of cities, I think we keep them as is.

#### Things to fix

- 
