# Bike-Sharing Data Schema

## Entity-Relationship Diagram

```
┌─────────────────────┐          ┌─────────────────────┐
│ BIKE_TYPES          │          │ CITIES              │
├─────────────────────┤        1 ├─────────────────────┤
│ PK id               │   ┌──────┤ PK id               │
└──────────┬──────────┘   │      └──────────┬──────────┘
           │ 1            │                 │ 1
           │              │                 │
           │ N            │                 │ N
┌──────────┴──────────┐   │      ┌──────────┴──────────┐
│ BIKES               │   │      │ STATIONS            │
├─────────────────────┤   │    1 ├─────────────────────┤
│ PK id               │   │  ┌───┤ PK id               │
│ FK bike_type_id     │   │  │   │ FK city_id          │
└──────────┬──────────┘   │  │   └──────────┬──────────┘
           │ 1            │  │              │ 1
           │              │  │              │
           │ N            │  │              │ N
┌──────────┴──────────┐   │  │   ┌──────────┴──────────┐
│ TRIPS               │   │  │   │ STATION_STATUS      │
├─────────────────────┤   │  │   ├─────────────────────┤
│ FK bike_id          │ N │  │   │ FK station_id       │
│ FK city_id          ├───┘  │   └─────────────────────┘
│ FK station_id_start ├──────┤
│ FK station_id_end   ├──────┘
└─────────────────────┘ N
```

**Cardinality**

| From       | To             | Type   | Via                                              |
|------------|----------------|--------|--------------------------------------------------|
| BIKE_TYPES | BIKES          | 1 : N  | `bikes.bike_type_id`                             |
| BIKES      | TRIPS          | 1 : N  | `trips.bike_id`                                  |
| CITIES     | TRIPS          | 1 : N  | `trips.city_id`                                  |
| CITIES     | STATIONS       | 1 : N  | `stations.city_id`                               |
| STATIONS   | TRIPS          | 0..1 : N | `trips.station_id_start`, `trips.station_id_end` (NULL = free-floating) |
| STATIONS   | STATION_STATUS | 1 : N  | `station_status.station_id`                      |

---

## Tables

### CITIES

| Column                  | Type   | Key | Unit | Notes                           |
|-------------------------|--------|-----|------|---------------------------------|
| id                      | int    | PK  |      |                                 |
| name                    | string |     |      | Bike-sharing scheme name        |
| lat                     | float  |     | °    | Approx. city center             |
| lon                     | float  |     | °    | Approx. city center             |
| timezone                | string |     |      | IANA, e.g. `Europe/Paris`       |
| country                 | string |     |      | ISO-3166 alpha-2                |
| return_to_official_only | bool   |     |      | `true` = must return to station |

### BIKE_TYPES

| Column           | Type   | Key | Unit | Notes                 |
|------------------|--------|-----|------|-----------------------|
| id               | int    | PK  |      | Technical bike type   |
| vehicle_image    | string |     |      | URL                   |
| name             | string |     |      | Commercial name       |
| description      | string |     |      | Free text             |
| form_factor      | string |     |      | `regular` / `cargo`   |
| rider_capacity   | int    |     |      | Seats                 |
| propulsion_type  | string |     |      | `human` / `electric`  |
| max_range        | float  |     | m    | Nominal electric range |
| battery_capacity | float  |     | Wh   | Battery energy        |

### BIKES

| Column       | Type   | Key | Notes                   |
|--------------|--------|-----|-------------------------|
| id           | int    | PK  | Bike identifier         |
| bike_type_id | int    | FK  | → `bike_types.id`       |
| computer_id  | string |     | On-board computer ID    |

### STATIONS

| Column        | Type   | Key | Unit | Notes                         |
|---------------|--------|-----|------|-------------------------------|
| id            | int    | PK  |      |                               |
| city_id       | int    | FK  |      | → `cities.id`                 |
| name          | string |     |      | Human-readable label          |
| app_number    | string |     |      | Number shown to users         |
| terminal_type | string |     |      | Hardware generation (12 vals) |
| place_type    | string |     |      | Unknown meaning (23 vals)     |
| bike_racks    | int    |     |      | Regular docks                 |
| special_racks | int    |     |      | Charging docks                |
| lon           | float  |     | °    |                               |
| lat           | float  |     | °    |                               |

### STATION_STATUS

| Column                  | Type     | Key | Unit | Notes                |
|-------------------------|----------|-----|------|----------------------|
| station_id              | int      | FK  |      | → `stations.id`      |
| time                    | datetime |     | s    | Snapshot, UTC        |
| bikes                   | int      |     |      | Total docked         |
| booked_bikes            | int      |     |      | Reserved by users    |
| bikes_available_to_rent | int      |     |      | Ready to rent        |
| free_racks              | int      |     |      | Empty regular docks  |
| free_special_racks      | int      |     |      | Empty charging docks |
| maintenance             | bool     |     |      | `true` = offline     |

### TRIPS

| Column           | Type     | Key | Unit | Notes                        |
|------------------|----------|-----|------|------------------------------|
| bike_id          | int      | FK  |      | → `bikes.id`                 |
| city_id          | int      | FK  |      | → `cities.id`                |
| time_start       | datetime |     | s    | Rental start, UTC            |
| lon_start        | float    |     | °    | WGS-84                       |
| lat_start        | float    |     | °    | WGS-84                       |
| lon_end          | float    |     | °    | WGS-84                       |
| lat_end          | float    |     | °    | WGS-84                       |
| station_id_start | int      | FK  |      | → `stations.id`, NULL if free-floating |
| station_id_end   | int      | FK  |      | → `stations.id`, NULL if free-floating |
| battery_start    | float    |     | %    | E-bikes only                 |
| battery_end      | float    |     | %    | E-bikes only                 |
| duration         | int      |     | s    | Trip duration                |
| distance         | float    |     | m    | Great-circle (PostGIS `ST_Distance`) |

---

## Notes

- `TRIPS` and `STATION_STATUS` have no declared primary key; natural keys are `(bike_id, time_start)` and `(station_id, time)`.
- `time_start` / `time` are given in seconds (UTC); they may be stored as epoch integers rather than datetimes.
- `CITIES.return_to_official_only = true` means trips in that city should never have NULL station IDs, which is a useful data-quality check.
