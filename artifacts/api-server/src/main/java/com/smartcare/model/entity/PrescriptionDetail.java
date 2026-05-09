package com.smartcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_detail")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Integer detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drug_id", nullable = false)
    private Drug drug;

    @Column(nullable = false)
    private String dosage;

    @Column(nullable = false)
    private String frequency;

    private String duration;
}
