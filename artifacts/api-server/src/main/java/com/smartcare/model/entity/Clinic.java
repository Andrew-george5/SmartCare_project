package com.smartcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clinic")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clinic_id")
    private Integer clinicId;

    @Column(nullable = false)
    private String type;
}
