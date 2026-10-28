import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import FilterSidebar from '../components/FilterSidebar.tsx'
import StationPanel from '../components/StationPanel.tsx'
import TripMap, { BIKE_COLOR, EBIKE_COLOR } from '../components/TripMap.tsx'
import { emptyForm, toTripFilter, type FilterForm } from '../lib/filterForm.ts'
import { CITIES, STATIONS, TRIPS_BY_FILTER, type City, type Station, type Trip } from '../lib/queries.ts'

export default function MapPage() {
  // `form` is what the user is editing; `applied` is what the map currently shows.
  const [form, setForm] = useState<FilterForm>(emptyForm)
  const [applied, setApplied] = useState<FilterForm>(emptyForm)
  const [showStations, setShowStations] = useState(true)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const citiesQuery = useQuery<{ cities: City[] }>(CITIES)
  const cities = useMemo(() => citiesQuery.data?.cities ?? [], [citiesQuery.data])
  const citiesById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities])

  // Re-runs automatically whenever `applied` changes.
  const tripsQuery = useQuery<{ tripsByFilter: Trip[] }>(TRIPS_BY_FILTER, {
    variables: { filter: toTripFilter(applied), limit: applied.limit },
  })
  const trips = useMemo(() => tripsQuery.data?.tripsByFilter ?? [], [tripsQuery.data])

  const appliedCityId = applied.cityId ? Number(applied.cityId) : undefined
  const stationsQuery = useQuery<{ stations: Station[] }>(STATIONS, {
    variables: { cityId: appliedCityId },
    skip: !appliedCityId || !showStations,
  })
  const stations = showStations && appliedCityId ? (stationsQuery.data?.stations ?? []) : []

  const apply = (next: FilterForm) => {
    setForm(next)
    setApplied(next)
    if (next.cityId !== applied.cityId) setSelectedStation(null)
  }

  const showTripsForStation = (station: Station) =>
    apply({ ...form, cityId: String(station.cityId), stationId: station.id })

  const error = tripsQuery.error ?? citiesQuery.error ?? stationsQuery.error

  return (
    <div className="flex h-full">
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
        <FilterSidebar
          cities={cities}
          form={form}
          onChange={setForm}
          onSubmit={() => apply(form)}
          showStations={showStations}
          onShowStationsChange={setShowStations}
        />
        <div className="mt-auto space-y-2 border-t border-slate-200 p-4 text-xs text-slate-600">
          <p>
            {tripsQuery.loading
              ? 'Loading trips…'
              : `Showing ${trips.length.toLocaleString()} trip${trips.length === 1 ? '' : 's'}${
                  trips.length === applied.limit ? ' (limit reached)' : ''
                }`}
            {stations.length > 0 && ` · ${stations.length} stations`}
          </p>
          <p className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4" style={{ background: BIKE_COLOR }} /> bike
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4" style={{ background: EBIKE_COLOR }} /> e-bike
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900" /> station
            </span>
          </p>
          {error && <p className="text-red-600">{error.message}</p>}
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <TripMap
          trips={trips}
          stations={stations}
          citiesById={citiesById}
          focusCity={appliedCityId ? citiesById.get(appliedCityId) : undefined}
          onStationClick={setSelectedStation}
        />
        {selectedStation && (
          <div className="absolute bottom-6 left-4 z-[1000]">
            <StationPanel
              key={selectedStation.id}
              station={selectedStation}
              onClose={() => setSelectedStation(null)}
              onShowTrips={showTripsForStation}
            />
          </div>
        )}
      </div>
    </div>
  )
}
