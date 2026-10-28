package com.eubiketrips.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/**
 * A bike-sharing scheme, usually one city. Mirrors the {@code city} table.
 * Column names are derived automatically: {@code returnToOfficialOnly} -> {@code return_to_official_only}.
 */
@Entity
public class City {

	@Id
	private Integer id;
	private String name;
	private Double lat;
	private Double lon;
	private String timezone;
	private String country;
	private Boolean returnToOfficialOnly;

	public Integer getId() { return id; }
	public String getName() { return name; }
	public Double getLat() { return lat; }
	public Double getLon() { return lon; }
	public String getTimezone() { return timezone; }
	public String getCountry() { return country; }
	public Boolean getReturnToOfficialOnly() { return returnToOfficialOnly; }
}
