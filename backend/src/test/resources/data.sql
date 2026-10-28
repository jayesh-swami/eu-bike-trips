-- Small fixture for GraphQlApiTests.
INSERT INTO city (id, name, lat, lon, timezone, country, return_to_official_only) VALUES
  (1, 'Testburg', 50.0, 8.0, 'Europe/Berlin', 'DE', false),
  (2, 'Otherville', 52.5, 13.4, 'Europe/Berlin', 'DE', true);

INSERT INTO station (id, city_id, name, bike_racks, special_racks, lat, lon) VALUES
  (100, 1, 'Main Station', 10, 0, 50.01, 8.01),
  (200, 2, 'Harbour', 5, 2, 52.51, 13.41);

INSERT INTO station_status (id, station_id, time, bikes, booked_bikes, bikes_available_to_rent,
                            free_racks, free_special_racks, maintenance) VALUES
  (1, 100, TIMESTAMP WITH TIME ZONE '2023-01-01 10:00:00+00', 3, 0, 3, 7, 0, false),
  (2, 100, TIMESTAMP WITH TIME ZONE '2023-01-01 11:00:00+00', 1, 0, 1, 9, 0, false);

INSERT INTO bike_type (id, name, propulsion_type) VALUES (1, 'Classic', 'human');
INSERT INTO bike (id, bike_type_id, computer_id) VALUES (10, 1, 0);

INSERT INTO trip (id, bike_id, city_id, time_start, lat_start, lon_start, lat_end, lon_end,
                  station_id_start, station_id_end, duration, distance) VALUES
  (1, 10, 1, TIMESTAMP WITH TIME ZONE '2023-01-01 08:00:00+00', 50.01, 8.01, 50.02, 8.02, 100, NULL, 600, 500.0),
  (2, 10, 1, TIMESTAMP WITH TIME ZONE '2023-01-02 08:00:00+00', 50.02, 8.02, 50.01, 8.01, NULL, 100, 900, 2500.0),
  (3, 10, 2, TIMESTAMP WITH TIME ZONE '2023-01-03 08:00:00+00', 52.51, 13.41, 52.52, 13.42, 200, 200, 300, 1200.0);
