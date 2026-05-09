package com.smartcare.service;

import com.smartcare.model.entity.PlatformSettings;
import com.smartcare.repository.PlatformSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PlatformSettingsService {

    private final PlatformSettingsRepository repo;

    public Map<String, Object> getSettings() {
        PlatformSettings s = repo.findById(1).orElseGet(() -> {
            PlatformSettings def = new PlatformSettings(1, new BigDecimal("10.00"));
            return repo.save(def);
        });
        return toMap(s);
    }

    @Transactional
    public Map<String, Object> updateSettings(Map<String, Object> body) {
        PlatformSettings s = repo.findById(1).orElseGet(() ->
                new PlatformSettings(1, new BigDecimal("10.00")));
        if (body.get("feePercent") != null) {
            BigDecimal val = body.get("feePercent") instanceof Number
                    ? BigDecimal.valueOf(((Number) body.get("feePercent")).doubleValue())
                    : new BigDecimal(body.get("feePercent").toString());
            if (val.compareTo(BigDecimal.ZERO) < 0 || val.compareTo(new BigDecimal("100")) > 0)
                throw new IllegalArgumentException("Fee percent must be between 0 and 100");
            s.setFeePercent(val);
        }
        return toMap(repo.save(s));
    }

    public BigDecimal getCurrentFeePercent() {
        return repo.findById(1)
                .map(PlatformSettings::getFeePercent)
                .orElse(new BigDecimal("10.00"));
    }

    private Map<String, Object> toMap(PlatformSettings s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("feePercent", s.getFeePercent());
        return m;
    }
}
