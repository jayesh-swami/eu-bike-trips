package com.eubiketrips.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** One snapshot of how many bikes and free racks a station had. Mirrors {@code station_status}. */
@Entity
public class StationStatus {

	@Id
	private Long id;
	private Long stationId;
	private Instant time;
	private Integer bikes;
	private Integer bookedBikes;
	private Integer bikesAvailableToRent;
	private Integer freeRacks;
	private Integer freeSpecialRacks;
	private Boolean maintenance;

	public Long getId() { return id; }
	public Long getStationId() { return stationId; }
	public Instant getTime() { return time; }
	public Integer getBikes() { return bikes; }
	public Integer getBookedBikes() { return bookedBikes; }
	public Integer getBikesAvailableToRent() { return bikesAvailableToRent; }
	public Integer getFreeRacks() { return freeRacks; }
	public Integer getFreeSpecialRacks() { return freeSpecialRacks; }
	public Boolean getMaintenance() { return maintenance; }
}
