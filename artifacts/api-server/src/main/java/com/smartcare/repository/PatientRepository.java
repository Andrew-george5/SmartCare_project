package com.smartcare.repository;

import com.smartcare.model.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Integer> {
    Optional<Patient> findByUserUserId(Integer userId);

    @Query("SELECT p FROM Patient p JOIN p.user u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Patient> searchPatients(@Param("search") String search);

    @Query("SELECT DISTINCT p FROM Patient p WHERE p.patientId IN (SELECT a.patient.patientId FROM Appointment a WHERE a.doctor.doctorId = :doctorId)")
    List<Patient> findPatientsByDoctorId(@Param("doctorId") Integer doctorId);
}
