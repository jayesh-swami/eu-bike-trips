package com.eubiketrips.graphql;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Java version of the {@code TripFilter} input type in schema.graphqls.
 * Spring for GraphQL fills in the record components by name; fields the client leaves out are null.
 */
public record TripFilter(
		Integer cityId,
		Long stationId,
		String fromDate,
		String toDate,
		Double minDistance,
		Double maxDistance) {

	/** Start of {@code fromDate} (UTC), or null if not set. */
	public Instant fromInstant() {
		return fromDate == null ? null : LocalDate.parse(fromDate).atStartOfDay().toInstant(ZoneOffset.UTC);
	}

	/** Start of the day after {@code toDate}, so the whole end day is included. */
	public Instant toInstant() {
		return toDate == null ? null : LocalDate.parse(toDate).plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
	}
}
