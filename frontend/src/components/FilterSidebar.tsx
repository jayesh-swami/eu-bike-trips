import type { FormEvent } from 'react'
import { emptyForm, type FilterForm } from '../lib/filterForm.ts'
import type { City } from '../lib/queries.ts'

type Props = {
  cities: City[]
  form: FilterForm
  onChange: (form: FilterForm) => void
  onSubmit: () => void
  showStations: boolean
  onShowStationsChange: (show: boolean) => void
}

// The dataset covers 2022-08-26 to 2023-07-15.
const DATA_START = '2022-08-26'
const DATA_END = '2023-07-15'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

export default function FilterSidebar({
  cities,
  form,
  onChange,
  onSubmit,
  showStations,
  onShowStationsChange,
}: Props) {
  const set = (patch: Partial<FilterForm>) => onChange({ ...form, ...patch })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div>
        <label className={labelClass} htmlFor="city">
          City
        </label>
        <select
          id="city"
          className={inputClass}
          value={form.cityId}
          // A station belongs to one city, so changing city clears the station.
          onChange={(e) => set({ cityId: e.target.value, stationId: '' })}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.country})
            </option>
          ))}
        </select>
      </div>

      {form.stationId && (
        <div className="flex items-center justify-between rounded-md bg-sky-50 px-2 py-1.5 text-xs text-sky-900">
          <span>Station {form.stationId}</span>
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => set({ stationId: '' })}
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="from">
            From
          </label>
          <input
            id="from"
            type="date"
            min={DATA_START}
            max={DATA_END}
            className={inputClass}
            value={form.fromDate}
            onChange={(e) => set({ fromDate: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="to">
            To
          </label>
          <input
            id="to"
            type="date"
            min={DATA_START}
            max={DATA_END}
            className={inputClass}
            value={form.toDate}
            onChange={(e) => set({ toDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="minDistance">
            Min distance (m)
          </label>
          <input
            id="minDistance"
            type="number"
            min={0}
            className={inputClass}
            value={form.minDistance}
            onChange={(e) => set({ minDistance: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="maxDistance">
            Max distance (m)
          </label>
          <input
            id="maxDistance"
            type="number"
            min={0}
            className={inputClass}
            value={form.maxDistance}
            onChange={(e) => set({ maxDistance: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="limit">
          Max trips: {form.limit}
        </label>
        <input
          id="limit"
          type="range"
          min={100}
          max={5000}
          step={100}
          className="w-full accent-slate-900"
          value={form.limit}
          onChange={(e) => set({ limit: Number(e.target.value) })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-slate-900"
          checked={showStations}
          disabled={!form.cityId}
          onChange={(e) => onShowStationsChange(e.target.checked)}
        />
        <span className={form.cityId ? '' : 'text-slate-400'}>
          Show stations {form.cityId ? '' : '(pick a city)'}
        </span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Apply filter
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          onClick={() => onChange(emptyForm)}
        >
          Reset
        </button>
      </div>
    </form>
  )
}
