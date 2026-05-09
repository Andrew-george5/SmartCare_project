package com.smartcare.repository;

import com.smartcare.model.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Integer> {
    List<MedicalRecord> findByPatientPatientId(Integer patientId);
    List<MedicalRecord> findByDoctorDoctorId(Integer doctorId);
    List<MedicalRecord> findByPatientPatientIdAndDoctorDoctorId(Integer patientId, Integer doctorId);
}
