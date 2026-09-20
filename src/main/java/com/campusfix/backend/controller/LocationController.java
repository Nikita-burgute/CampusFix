package com.campusfix.backend.controller;

import com.campusfix.backend.entity.Location;
import com.campusfix.backend.service.LocationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @PostMapping
    public Location createLocation(@RequestBody Location location) {
        return locationService.createLocation(location);
    }

    @GetMapping
    public List<Location> getAllLocations() {
        return locationService.getAllLocations();
    }

    @GetMapping("/{id}")
    public Location getLocationById(@PathVariable Long id) {
        return locationService.getLocationById(id);
    }

    @PutMapping("/{id}")
    public Location updateLocation(
            @PathVariable Long id,
            @RequestBody Location location) {

        return locationService.updateLocation(id, location);
    }

    @DeleteMapping("/{id}")
    public String deleteLocation(@PathVariable Long id) {

        locationService.deleteLocation(id);

        return "Location deleted successfully";
    }
}