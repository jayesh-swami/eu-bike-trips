package com.eubiketrips.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** A docking station. Mirrors the {@code station} table. */
@Entity
public class Station {

	@Id
	private Long id;
	private Integer cityId;
	private String name;
	private String appNumber;
	private String terminalType;
	private String placeType;
	private Integer bikeRacks;
	private Integer specialRacks;
	private Integer rackLocks;
	private Double lat;
	private Double lon;

	public Long getId() { return id; }
	public Integer getCityId() { return cityId; }
	public String getName() { return name; }
	public String getAppNumber() { return appNumber; }
	public String getTerminalType() { return terminalType; }
	public String getPlaceType() { return placeType; }
	public Integer getBikeRacks() { return bikeRacks; }
	public Integer getSpecialRacks() { return specialRacks; }
	public Integer getRackLocks() { return rackLocks; }
	public Double getLat() { return lat; }
	public Double getLon() { return lon; }
}
