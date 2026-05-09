package com.smartcare.repository;

import com.smartcare.model.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    List<Prescription> findByRecordPatientPatientId(Integer patientId);
    List<Prescription> findByRecordDoctorDoctorId(Integer doctorId);

    @Query("SELECT p FROM Prescription p JOIN FETCH p.details d JOIN FETCH d.drug WHERE p.record.patient.patientId = :patientId")
    List<Prescription> findByPatientIdWithDetails(@Param("patientId") Integer patientId);
}
