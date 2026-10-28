import type { TripFilter } from './queries.ts'

/** Raw form values; empty string means "not set". */
export type FilterForm = {
  cityId: string
  stationId: string
  fromDate: string
  toDate: string
  minDistance: string
  maxDistance: string
  limit: number
}

export const emptyForm: FilterForm = {
  cityId: '',
  stationId: '',
  fromDate: '',
  toDate: '',
  minDistance: '',
  maxDistance: '',
  limit: 1000,
}

/** Turns the form into the TripFilter GraphQL input, leaving out empty fields. */
export function toTripFilter(form: FilterForm): TripFilter {
  const filter: TripFilter = {}
  if (form.cityId) filter.cityId = Number(form.cityId)
  if (form.stationId) filter.stationId = form.stationId
  if (form.fromDate) filter.fromDate = form.fromDate
  if (form.toDate) filter.toDate = form.toDate
  if (form.minDistance) filter.minDistance = Number(form.minDistance)
  if (form.maxDistance) filter.maxDistance = Number(form.maxDistance)
  return filter
}
