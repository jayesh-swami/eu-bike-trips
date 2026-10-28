package com.eubiketrips.graphql;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.eubiketrips.model.Station;
import com.eubiketrips.model.StationStatus;
import com.eubiketrips.repository.StationRepository;
import com.eubiketrips.repository.StationStatusRepository;

@Controller
public class StationController {

	/** ~2.9M status snapshots in total; a busy station has over 16,000. */
	private static final int MAX_STATUS_LIMIT = 1000;

	private final StationRepository stationRepository;
	private final StationStatusRepository stationStatusRepository;

	public StationController(StationRepository stationRepository, StationStatusRepository stationStatusRepository) {
		this.stationRepository = stationRepository;
		this.stationStatusRepository = stationStatusRepository;
	}

	@QueryMapping
	public List<Station> stations(@Argument Integer cityId) {
		return stationRepository.findByCityIdOrderByName(cityId);
	}

	/** The schema declares stationId as ID (sent as a string); Spring converts it to Long. */
	@QueryMapping
	public List<StationStatus> stationStatus(@Argument Long stationId, @Argument int limit) {
		return stationStatusRepository.findByStationIdOrderByTimeDesc(stationId,
				Limit.of(Math.clamp(limit, 1, MAX_STATUS_LIMIT)));
	}
}
