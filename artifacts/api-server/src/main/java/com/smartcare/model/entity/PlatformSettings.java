package com.smartcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "platform_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlatformSettings {

    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "fee_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal feePercent;
}
