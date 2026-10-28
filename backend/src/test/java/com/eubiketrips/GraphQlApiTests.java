package com.eubiketrips;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureHttpGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.HttpGraphQlTester;

/**
 * Sends real GraphQL documents to /graphql and checks the JSON that comes back.
 * Data comes from src/test/resources/data.sql (in-memory database).
 */
@SpringBootTest
@AutoConfigureHttpGraphQlTester
class GraphQlApiTests {

	@Autowired
	private HttpGraphQlTester graphQlTester;

	@Test
	void allTripsReturnsNewestFirst() {
		graphQlTester.document("{ allTrips(limit: 2) { id timeStart } }")
				.execute()
				.path("allTrips[*].id").entityList(String.class).containsExactly("3", "2")
				.path("allTrips[0].timeStart").entity(String.class).isEqualTo("2023-01-03T08:00:00Z");
	}

	@Test
	void tripsByFilterCombinesConditions() {
		graphQlTester.document("""
				{ tripsByFilter(filter: { cityId: 1, minDistance: 1000 }) { id distance } }
				""")
				.execute()
				.path("tripsByFilter[*].id").entityList(String.class).containsExactly("2");
	}

	@Test
	void tripsByFilterUsesVariablesAndInclusiveDates() {
		graphQlTester.document("""
				query ($filter: TripFilter!) { tripsByFilter(filter: $filter) { id } }
				""")
				.variable("filter", Map.of("fromDate", "2023-01-01", "toDate", "2023-01-02"))
				.execute()
				.path("tripsByFilter[*].id").entityList(String.class).containsExactly("2", "1");
	}

	@Test
	void tripsByFilterMatchesStartOrEndStation() {
		graphQlTester.document("{ tripsByFilter(filter: { stationId: \"100\" }) { id } }")
				.execute()
				.path("tripsByFilter[*].id").entityList(String.class).containsExactly("2", "1");
	}

	@Test
	void nestedCityIsResolved() {
		graphQlTester.document("{ allTrips(limit: 1) { id city { name country } } }")
				.execute()
				.path("allTrips[0].city.name").entity(String.class).isEqualTo("Otherville");
	}

	@Test
	void stationsAndStatus() {
		graphQlTester.document("""
				{
				  stations(cityId: 1) { id name bikeRacks }
				  stationStatus(stationId: "100", limit: 1) { time bikesAvailableToRent maintenance }
				}
				""")
				.execute()
				.path("stations[0].name").entity(String.class).isEqualTo("Main Station")
				.path("stationStatus[0].bikesAvailableToRent").entity(Integer.class).isEqualTo(1);
	}

	@Test
	void unknownFieldIsAValidationError() {
		graphQlTester.document("{ allTrips { nope } }")
				.execute()
				.errors().expect(error -> error.getMessage().contains("nope")).verify();
	}
}
