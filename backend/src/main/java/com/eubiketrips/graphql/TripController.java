package com.eubiketrips.graphql;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import com.eubiketrips.model.City;
import com.eubiketrips.model.Trip;
import com.eubiketrips.repository.CityRepository;
import com.eubiketrips.repository.TripRepository;

/**
 * Resolves the trip fields of the schema.
 * <p>
 * {@code @QueryMapping} binds a method to the field of the same name on {@code type Query}.
 * {@code @Argument} binds a method parameter to the GraphQL argument of the same name.
 */
@Controller
public class TripController {

	/** The trip table has ~1.16M rows, so never return more than this in one request. */
	private static final int MAX_LIMIT = 5000;

	private final TripRepository tripRepository;
	private final CityRepository cityRepository;

	public TripController(TripRepository tripRepository, CityRepository cityRepository) {
		this.tripRepository = tripRepository;
		this.cityRepository = cityRepository;
	}

	@QueryMapping
	public List<Trip> allTrips(@Argument int limit) {
		return tripRepository.findByOrderByTimeStartDesc(Limit.of(Math.clamp(limit, 1, MAX_LIMIT)));
	}

	@QueryMapping
	public List<Trip> tripsByFilter(@Argument TripFilter filter, @Argument int limit) {
		return tripRepository.findByFilter(
				filter.cityId(),
				filter.stationId(),
				filter.fromInstant(),
				filter.toInstant(),
				filter.minDistance(),
				filter.maxDistance(),
				Limit.of(Math.clamp(limit, 1, MAX_LIMIT)));
	}

	/**
	 * Resolves the nested {@code city} field on {@code type Trip}. Spring passes in the parent Trip.
	 * <p>
	 * This runs once per trip in the result: 500 trips means 500 city lookups (the "N+1 problem";
	 * watch the SQL log). {@code @BatchMapping} resolves all of them in one call. See README "Learn next".
	 * Every other Trip field needs no method: Spring reads it from the matching getter.
	 */
	@SchemaMapping
	public City city(Trip trip) {
		return cityRepository.findById(trip.getCityId()).orElseThrow();
	}
}
