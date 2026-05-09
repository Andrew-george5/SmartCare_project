package com.smartcare.controller;

import com.smartcare.service.PlatformSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class PlatformSettingsController {

    private final PlatformSettingsService service;

    @GetMapping
    public ResponseEntity<Map<String, Object>> get() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> update(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateSettings(body));
    }
}
