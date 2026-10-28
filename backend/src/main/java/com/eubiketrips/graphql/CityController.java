package com.eubiketrips.graphql;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.eubiketrips.model.City;
import com.eubiketrips.repository.CityRepository;

@Controller
public class CityController {

	private final CityRepository cityRepository;

	public CityController(CityRepository cityRepository) {
		this.cityRepository = cityRepository;
	}

	@QueryMapping
	public List<City> cities() {
		return cityRepository.findAll(Sort.by("name"));
	}
}
