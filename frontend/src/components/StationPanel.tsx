import { useQuery } from '@apollo/client/react'
import { STATION_STATUS, type Station, type StationStatus } from '../lib/queries.ts'

type Props = {
  station: Station
  onClose: () => void
  onShowTrips: (station: Station) => void
}

/** Small SVG line of bikes available over time (oldest left). */
function AvailabilityLine({ history }: { history: StationStatus[] }) {
  const width = 280
  const height = 64
  const max = Math.max(1, ...history.map((s) => s.bikesAvailableToRent))
  const points = history
    .map((s, i) => {
      const x = history.length === 1 ? width / 2 : (i / (history.length - 1)) * width
      const y = height - (s.bikesAvailableToRent / max) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" role="img" aria-label="Bikes available over time">
      <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="#e2e8f0" />
      <polyline points={points} fill="none" stroke="#0f172a" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

export default function StationPanel({ station, onClose, onShowTrips }: Props) {
  const { data, loading, error } = useQuery<{ stationStatus: StationStatus[] }>(STATION_STATUS, {
    variables: { stationId: station.id, limit: 200 },
  })

  // The API returns newest first; the chart reads left to right in time.
  const history = [...(data?.stationStatus ?? [])].reverse()
  const latest = data?.stationStatus[0]

  return (
    <div className="w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{station.name}</h2>
          <p className="text-xs text-slate-500">
            Station {station.id} · {station.bikeRacks ?? '?'} racks
            {station.specialRacks ? ` · ${station.specialRacks} charging` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
          ✕
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading status…</p>}
      {error && <p className="text-xs text-red-600">{error.message}</p>}
      {!loading && !error && !latest && <p className="text-xs text-slate-500">No status snapshots.</p>}

      {latest && (
        <>
          <dl className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-slate-50 p-2">
              <dt className="text-[11px] text-slate-500">Available</dt>
              <dd className="text-lg font-semibold">{latest.bikesAvailableToRent}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <dt className="text-[11px] text-slate-500">Docked</dt>
              <dd className="text-lg font-semibold">{latest.bikes}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <dt className="text-[11px] text-slate-500">Free racks</dt>
              <dd className="text-lg font-semibold">{latest.freeRacks}</dd>
            </div>
          </dl>
          <p className="mb-1 text-[11px] text-slate-500">
            Bikes available, last {history.length} snapshots
            {latest.maintenance && <span className="ml-1 font-medium text-amber-700">· in maintenance</span>}
          </p>
          <AvailabilityLine history={history} />
          <p className="mt-1 text-right text-[11px] text-slate-400">as of {new Date(latest.time).toLocaleString()}</p>
        </>
      )}

      <button
        type="button"
        onClick={() => onShowTrips(station)}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
      >
        Trips from/to here
      </button>
    </div>
  )
}
