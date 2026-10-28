import { useEffect } from 'react'
import { CircleMarker, LayersControl, LayerGroup, MapContainer, Pane, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'
import type { City, Station, Trip } from '../lib/queries.ts'

// Trips with battery data come from e-bikes.
export const EBIKE_COLOR = '#d97706'
export const BIKE_COLOR = '#2563eb'
const STATION_COLOR = '#0f172a'

type Props = {
  trips: Trip[]
  stations: Station[]
  citiesById: Map<number, City>
  focusCity: City | undefined
  onStationClick: (station: Station) => void
}

/** Zooms the map to the trips whenever a new result arrives. */
function FitToTrips({ trips, focusCity }: { trips: Trip[]; focusCity: City | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (trips.length > 0) {
      const bounds = latLngBounds(trips.flatMap((t) => [[t.latStart, t.lonStart], [t.latEnd, t.lonEnd]] as [number, number][]))
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
    } else if (focusCity) {
      map.setView([focusCity.lat, focusCity.lon], 12)
    }
  }, [map, trips, focusCity])
  return null
}

const formatDuration = (seconds: number) =>
  seconds >= 3600 ? `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min` : `${Math.round(seconds / 60)} min`

export default function TripMap({ trips, stations, citiesById, focusCity, onStationClick }: Props) {
  return (
    // preferCanvas draws vector shapes on a canvas instead of SVG; much faster for thousands of lines.
    <MapContainer center={[50.5, 10]} zoom={5} preferCanvas className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToTrips trips={trips} focusCity={focusCity} />

      <LayersControl position="topright">
        <LayersControl.Overlay checked name="Trips">
          <LayerGroup>
            {trips.map((t) => {
              const color = t.batteryStart != null ? EBIKE_COLOR : BIKE_COLOR
              const city = citiesById.get(t.cityId)
              return (
                <LayerGroup key={t.id}>
                  <Polyline
                    positions={[
                      [t.latStart, t.lonStart],
                      [t.latEnd, t.lonEnd],
                    ]}
                    pathOptions={{ color, weight: 2, opacity: 0.6 }}
                  >
                    <Popup>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold">Trip {t.id}</div>
                        <div>{new Date(t.timeStart).toLocaleString()}</div>
                        <div>
                          {(t.distance / 1000).toFixed(2)} km · {formatDuration(t.duration)}
                        </div>
                        {city && <div>{city.name}</div>}
                        <div className="text-slate-500">
                          Station {t.stationIdStart ?? 'free-floating'} → {t.stationIdEnd ?? 'free-floating'}
                        </div>
                        {t.batteryStart != null && (
                          <div>
                            Battery {t.batteryStart}% → {t.batteryEnd ?? '?'}%
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polyline>
                  <CircleMarker center={[t.latStart, t.lonStart]} radius={2} pathOptions={{ color, fillOpacity: 1 }} />
                </LayerGroup>
              )
            })}
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Stations">
          {/* Own pane (and canvas) above the default overlay pane, so trip lines never cover stations. */}
          <Pane name="stations" style={{ zIndex: 450 }}>
            <LayerGroup>
              {stations.map((s) => (
                <CircleMarker
                  key={s.id}
                  center={[s.lat, s.lon]}
                  radius={7}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: STATION_COLOR, fillOpacity: 1 }}
                  eventHandlers={{ click: () => onStationClick(s) }}
                />
              ))}
            </LayerGroup>
          </Pane>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  )
}
