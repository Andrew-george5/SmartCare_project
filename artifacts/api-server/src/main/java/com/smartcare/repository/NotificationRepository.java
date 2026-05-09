package com.smartcare.repository;

import com.smartcare.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserUserIdOrderBySentAtDesc(Integer userId);
    List<Notification> findByUserUserIdAndIsReadOrderBySentAtDesc(Integer userId, Boolean isRead);
}
