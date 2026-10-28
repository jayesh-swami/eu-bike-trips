import { gql } from '@apollo/client'

// These mirror the types in backend/src/main/resources/graphql/schema.graphqls.

export type City = {
  id: number
  name: string
  country: string
  lat: number
  lon: number
  timezone: string
}

export type Trip = {
  id: string
  cityId: number
  timeStart: string
  latStart: number
  lonStart: number
  latEnd: number
  lonEnd: number
  stationIdStart: string | null
  stationIdEnd: string | null
  batteryStart: number | null
  batteryEnd: number | null
  duration: number
  distance: number
}

export type Station = {
  id: string
  name: string
  cityId: number
  bikeRacks: number | null
  specialRacks: number | null
  lat: number
  lon: number
}

export type StationStatus = {
  time: string
  bikes: number
  bikesAvailableToRent: number
  freeRacks: number
  maintenance: boolean
}

/** Every field optional, like the TripFilter input type. */
export type TripFilter = {
  cityId?: number
  stationId?: string
  fromDate?: string
  toDate?: string
  minDistance?: number
  maxDistance?: number
}

export const CITIES = gql`
  query Cities {
    cities {
      id
      name
      country
      lat
      lon
      timezone
    }
  }
`

export const TRIPS_BY_FILTER = gql`
  query TripsByFilter($filter: TripFilter!, $limit: Int) {
    tripsByFilter(filter: $filter, limit: $limit) {
      id
      cityId
      timeStart
      latStart
      lonStart
      latEnd
      lonEnd
      stationIdStart
      stationIdEnd
      batteryStart
      batteryEnd
      duration
      distance
    }
  }
`

export const STATIONS = gql`
  query Stations($cityId: Int!) {
    stations(cityId: $cityId) {
      id
      name
      cityId
      bikeRacks
      specialRacks
      lat
      lon
    }
  }
`

export const STATION_STATUS = gql`
  query StationStatus($stationId: ID!, $limit: Int) {
    stationStatus(stationId: $stationId, limit: $limit) {
      time
      bikes
      bikesAvailableToRent
      freeRacks
      maintenance
    }
  }
`
