package com.smartcare.controller;

import com.smartcare.service.ClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ClinicController {

    private final ClinicService clinicService;

    @GetMapping("/clinics")
    public ResponseEntity<List<Map<String, Object>>> listClinics() {
        return ResponseEntity.ok(clinicService.listClinics());
    }

    @PostMapping("/clinics")
    public ResponseEntity<Map<String, Object>> createClinic(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clinicService.createClinic(body));
    }

    @GetMapping("/clinics/{id}")
    public ResponseEntity<Map<String, Object>> getClinic(@PathVariable Integer id) {
        return ResponseEntity.ok(clinicService.getClinicById(id));
    }

    @GetMapping("/clinic-reservations")
    public ResponseEntity<List<Map<String, Object>>> listReservations(
            @RequestParam(required = false) Integer doctorId,
            @RequestParam(required = false) Integer clinicId,
            @RequestParam(required = false) String day) {
        return ResponseEntity.ok(clinicService.listReservations(doctorId, clinicId, day));
    }

    @PostMapping("/clinic-reservations")
    public ResponseEntity<Map<String, Object>> createReservation(
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clinicService.createReservation(body));
    }

    @DeleteMapping("/clinic-reservations/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Integer id) {
        clinicService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
}
