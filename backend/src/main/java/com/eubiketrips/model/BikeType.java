package com.eubiketrips.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** A bike model, from the cleaned bike_types CSV. Mirrors {@code bike_type}. Not exposed in GraphQL yet. */
@Entity
public class BikeType {

	@Id
	private Integer id;
	private String vehicleImage;
	private String name;
	private String description;
	private String formFactor;
	private Integer riderCapacity;
	/** human / electric_assist / unknown */
	private String propulsionType;
	/** Meters. */
	private Double maxRange;
	/** Wh. */
	private Double batteryCapacity;
	private Boolean typeInfoMissing;
	private String propulsionFilled;

	public Integer getId() { return id; }
	public String getVehicleImage() { return vehicleImage; }
	public String getName() { return name; }
	public String getDescription() { return description; }
	public String getFormFactor() { return formFactor; }
	public Integer getRiderCapacity() { return riderCapacity; }
	public String getPropulsionType() { return propulsionType; }
	public Double getMaxRange() { return maxRange; }
	public Double getBatteryCapacity() { return batteryCapacity; }
	public Boolean getTypeInfoMissing() { return typeInfoMissing; }
	public String getPropulsionFilled() { return propulsionFilled; }
}
