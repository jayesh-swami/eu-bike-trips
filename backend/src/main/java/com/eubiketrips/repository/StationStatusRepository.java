package com.eubiketrips.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import com.eubiketrips.model.StationStatus;

public interface StationStatusRepository extends JpaRepository<StationStatus, Long> {

	/** Newest snapshots first; {@link Limit} becomes a SQL LIMIT. */
	List<StationStatus> findByStationIdOrderByTimeDesc(Long stationId, Limit limit);
}
