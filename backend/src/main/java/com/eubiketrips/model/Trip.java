package com.eubiketrips.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/**
 * One rental. Mirrors the {@code trip} table.
 * <p>
 * Related rows are referenced by plain id fields ({@code cityId}, {@code stationIdStart}) rather than
 * JPA relationships. The GraphQL layer shows how to turn {@code cityId} into a nested {@code city} field.
 */
@Entity
public class Trip {

	@Id
	private Long id;
	private Integer bikeId;
	private Integer cityId;
	private Instant timeStart;
	private Double latStart;
	private Double lonStart;
	private Double latEnd;
	private Double lonEnd;
	/** Null for free-floating rentals, or for ids missing from stations.csv. */
	private Long stationIdStart;
	private Long stationIdEnd;
	/** Battery percentage; e-bikes only. */
	private Double batteryStart;
	private Double batteryEnd;
	/** Seconds. */
	private Integer duration;
	/** Meters (great-circle between start and end). */
	private Double distance;

	public Long getId() { return id; }
	public Integer getBikeId() { return bikeId; }
	public Integer getCityId() { return cityId; }
	public Instant getTimeStart() { return timeStart; }
	public Double getLatStart() { return latStart; }
	public Double getLonStart() { return lonStart; }
	public Double getLatEnd() { return latEnd; }
	public Double getLonEnd() { return lonEnd; }
	public Long getStationIdStart() { return stationIdStart; }
	public Long getStationIdEnd() { return stationIdEnd; }
	public Double getBatteryStart() { return batteryStart; }
	public Double getBatteryEnd() { return batteryEnd; }
	public Integer getDuration() { return duration; }
	public Double getDistance() { return distance; }
}
