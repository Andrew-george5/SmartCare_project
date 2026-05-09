package com.smartcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clinic_reservation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Integer reservationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false, length = 20)
    private String day;

    @Column(name = "start_hour", nullable = false)
    private String startHour;

    @Column(name = "end_hour", nullable = false)
    private String endHour;

    @Column(name = "max_patients", nullable = false)
    @Builder.Default
    private Integer maxPatients = 1;
}
