package com.smartcare.controller;

import com.smartcare.exception.UnauthorizedException;
import com.smartcare.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestParam(required = false) Integer patientId,
            @RequestParam(required = false) Integer doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(appointmentService.listAppointments(patientId, doctorId, status, date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body, Authentication auth) {
        boolean isDoctor = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
        if (isDoctor) {
            throw new UnauthorizedException("Doctors are not allowed to book appointments.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createAppointment(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable Integer id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }
}
