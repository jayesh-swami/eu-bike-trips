package com.eubiketrips.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** A physical bike. Mirrors the {@code bike} table. Not exposed in GraphQL yet. */
@Entity
public class Bike {

	@Id
	private Integer id;
	private Integer bikeTypeId;
	/** On-board computer id; 0 means unknown and values are not unique. */
	private Long computerId;

	public Integer getId() { return id; }
	public Integer getBikeTypeId() { return bikeTypeId; }
	public Long getComputerId() { return computerId; }
}
