package com.eubiketrips.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eubiketrips.model.Station;

public interface StationRepository extends JpaRepository<Station, Long> {

	/** Spring Data writes the query from the method name: WHERE city_id = ? ORDER BY name. */
	List<Station> findByCityIdOrderByName(Integer cityId);
}
