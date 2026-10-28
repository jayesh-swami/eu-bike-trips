package com.eubiketrips.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eubiketrips.model.City;

/** findAll, findById, ... come from JpaRepository; nothing else is needed. */
public interface CityRepository extends JpaRepository<City, Integer> {
}
