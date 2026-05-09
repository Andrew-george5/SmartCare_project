package com.smartcare.controller;

import com.smartcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Boolean isRead) {
        return ResponseEntity.ok(notificationService.listForUser(userDetails.getUsername(), isRead));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Integer id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }
}
