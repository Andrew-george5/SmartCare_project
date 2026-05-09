package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Notification;
import com.smartcare.repository.AppUserRepository;
import com.smartcare.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppUserRepository userRepository;

    public List<Map<String, Object>> listForUser(String email, Boolean isRead) {
        Integer userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                .getUserId();

        List<Notification> list = (isRead != null)
                ? notificationRepository.findByUserUserIdAndIsReadOrderBySentAtDesc(userId, isRead)
                : notificationRepository.findByUserUserIdOrderBySentAtDesc(userId);

        return list.stream().map(this::mapNotification).collect(Collectors.toList());
    }

    @Transactional
    public void createNotification(Integer userId, String type, String message) {
        com.smartcare.model.entity.AppUser user = userRepository.findById(userId)
                .orElse(null);
        if (user == null) return;
        Notification n = Notification.builder()
                .user(user)
                .type(com.smartcare.model.enums.NotificationType.valueOf(type))
                .channel(com.smartcare.model.enums.NotificationChannel.IN_APP)
                .message(message)
                .build();
        notificationRepository.save(n);
    }

    @Transactional
    public Map<String, Object> markRead(Integer id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        n.setIsRead(true);
        return mapNotification(notificationRepository.save(n));
    }

    private Map<String, Object> mapNotification(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("notificationId", n.getNotificationId());
        m.put("userId", n.getUser().getUserId());
        m.put("type", n.getType().name());
        m.put("channel", n.getChannel().name());
        m.put("message", n.getMessage());
        m.put("sentAt", n.getSentAt() != null ? n.getSentAt().toString() : null);
        m.put("isRead", n.getIsRead());
        return m;
    }
}
