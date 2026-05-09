package com.smartcare.controller;

import com.smartcare.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/appointment-trends")
    public ResponseEntity<List<Map<String, Object>>> appointmentTrends() {
        return ResponseEntity.ok(dashboardService.getAppointmentTrends());
    }

    @GetMapping("/revenue-summary")
    public ResponseEntity<List<Map<String, Object>>> revenueSummary() {
        return ResponseEntity.ok(dashboardService.getRevenueSummary());
    }

    @GetMapping("/doctor-performance")
    public ResponseEntity<List<Map<String, Object>>> doctorPerformance() {
        return ResponseEntity.ok(dashboardService.getDoctorPerformance());
    }
}
