package com.smartcare.repository;

import com.smartcare.model.entity.ClinicReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClinicReservationRepository extends JpaRepository<ClinicReservation, Integer> {
    List<ClinicReservation> findByClinicClinicId(Integer clinicId);
    List<ClinicReservation> findByDoctorDoctorId(Integer doctorId);
    List<ClinicReservation> findByDay(String day);
    List<ClinicReservation> findByDoctorDoctorIdAndDay(Integer doctorId, String day);
    List<ClinicReservation> findByClinicClinicIdAndDay(Integer clinicId, String day);
}
