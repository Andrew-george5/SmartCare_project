package com.smartcare.repository;

import com.smartcare.model.entity.PlatformSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, Integer> {
}
