package com.eubiketrips.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.eubiketrips.model.Trip;

public interface TripRepository extends JpaRepository<Trip, Long> {

	List<Trip> findByOrderByTimeStartDesc(Limit limit);

	/**
	 * Every parameter is optional: "(:x IS NULL OR ...)" skips a condition when its value is null.
	 * This is JPQL, so it uses entity field names (t.cityId), not column names (city_id).
	 */
	@Query("""
			SELECT t FROM Trip t
			WHERE (:cityId IS NULL OR t.cityId = :cityId)
			  AND (:stationId IS NULL OR t.stationIdStart = :stationId OR t.stationIdEnd = :stationId)
			  AND (:from IS NULL OR t.timeStart >= :from)
			  AND (:to IS NULL OR t.timeStart < :to)
			  AND (:minDistance IS NULL OR t.distance >= :minDistance)
			  AND (:maxDistance IS NULL OR t.distance <= :maxDistance)
			ORDER BY t.timeStart DESC
			""")
	List<Trip> findByFilter(@Param("cityId") Integer cityId,
			@Param("stationId") Long stationId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("minDistance") Double minDistance,
			@Param("maxDistance") Double maxDistance,
			Limit limit);
}
