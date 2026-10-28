# EU Bike Trips

Bike-sharing trips from ~185 European cities (Aug 2022 – Jul 2023) on a map, served through a GraphQL API.

- **backend/**: Spring Boot 4, Spring for GraphQL, Spring Data JPA, H2 (embedded, file-based)
- **frontend/**: React + Vite, Tailwind CSS, Leaflet (react-leaflet), Apollo Client
- **data_findings/**: the source CSVs, the data notes (`schema.md`, `FINDINGS.md`) and the notebooks

```
eu-bike-trips/
├── data_findings/data/          CSVs loaded into the database
├── db/                          H2 database file, built by Flyway (gitignored)
├── backend/
│   ├── db/migration/            Flyway SQL migrations: schema + CSV loads
│   └── src/main/
│       ├── java/com/eubiketrips/
│       │   ├── model/           JPA entities, one per table
│       │   ├── repository/      Spring Data repositories
│       │   └── graphql/         GraphQL controllers (resolvers)
│       └── resources/
│           ├── application.yml
│           └── graphql/schema.graphqls
└── frontend/src/
    ├── lib/                     Apollo client, GraphQL queries + types
    ├── components/              TripMap, FilterSidebar, StationPanel
    └── pages/                   MapPage
```

## Prerequisites

- **JDK 21**, e.g. Temurin. The Gradle wrapper downloads Gradle itself.
- **Node.js 20+** and npm

## 1. Build the database (once)

Loading data is a separate, manual step. The app never creates or migrates the database; it only reads it.
[Flyway](https://documentation.red-gate.com/flyway) runs the SQL files in `backend/db/migration/` in order
and records each one in the `flyway_schema_history` table, so running it again only applies new files.

Stop the backend first, since H2 allows only one process to open the file.

```bash
cd backend
./gradlew flywayInfo                  # which migrations are applied / pending
./gradlew flywayMigrate               # first run: ~4.1M rows, about 1.5 minutes; then compacts db/trips.mv.db
./gradlew flywayClean flywayMigrate   # wipe everything and rebuild
```

| Migration | What it does |
|---|---|
| `V1__schema.sql` | Tables, keys and indexes |
| `V2`–`V7` | Load `cities`, `stations`, `stations_status`, `bike_types_clean`, `bikes` and `trips_small` with H2's `CSVREAD` |
| `V8__clean_battery_human_bikes.sql` | Data fix from `FINDINGS.md` |

To change the data, add a new file such as `V9__add_some_index.sql` and run `flywayMigrate`.
Don't edit a migration that has already run: Flyway checksums them and will refuse to continue.

## 2. Run the backend

```bash
cd backend
./gradlew bootRun      # http://localhost:8080
./gradlew test         # GraphQL API tests (in-memory database, independent of db/)
```

- GraphiQL (schema docs + query editor): http://localhost:8080/graphiql
- H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:file:../db/trips`, user `sa`, no password)

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Vite proxies `/graphql` to the backend on port 8080.

Filter by city, date range and distance. Turn on stations and click one to see its recent availability, or to show only trips starting or ending there.

## How the GraphQL part fits together

1. `schema.graphqls` declares what clients can ask for: the `Query` fields, the `TripFilter` input and the object types.
2. A controller method annotated `@QueryMapping` answers the `Query` field with the same name.
   Its `@Argument` parameters receive the field's arguments by name.
3. Fields on returned objects (`Trip.distance`, …) are read from the matching getter automatically.
   `Trip.city` has no getter, so `TripController.city(Trip)` (`@SchemaMapping`) resolves it.
4. Spring for GraphQL checks every request against the schema before any of your code runs.
   That's why an unknown field fails with a validation error.

Watch the SQL log (`show-sql: true`) while running `{ allTrips(limit: 20) { city { name } } }`:
that's one query for the trips plus one per trip for its city.

## Learn next

Ideas for extending the API, roughly from easiest to hardest:

1. **Fix the N+1**: replace the `@SchemaMapping` for `Trip.city` with `@BatchMapping`, which loads all cities in one call.
2. **More relations**: `Station.city`, `Trip.startStation`, `Station.latestStatus`.
3. **Pagination**: add `offset`, or return a `TripPage { total items }` type.
4. **A custom `DateTime` scalar** instead of ISO strings.
5. **Filter by e-bike vs. human-powered**: join `bike` → `bike_type.propulsion_type`.
6. **Faster filters**: `(:x IS NULL OR …)` keeps the query simple but stops H2 from using the
   `city_id` index. A city with few trips takes 1–3 s. Try building the query dynamically
   (Spring Data `Specification` or Querydsl) and compare.
7. **A mutation**: e.g. let users tag or bookmark trips. This needs a writable database or table.
