package com.smartcare.repository;

import com.smartcare.model.entity.Appointment;
import com.smartcare.model.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByPatientPatientId(Integer patientId);
    List<Appointment> findByDoctorDoctorId(Integer doctorId);
    List<Appointment> findByStatus(AppointmentStatus status);
    List<Appointment> findByPatientPatientIdAndStatus(Integer patientId, AppointmentStatus status);
    List<Appointment> findByDoctorDoctorIdAndStatus(Integer doctorId, AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.dateTime >= :start AND a.dateTime < :end")
    List<Appointment> findByDateTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status")
    Long countByStatus(@Param("status") AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.dateTime >= :start AND a.dateTime < :end")
    Long countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT CAST(a.dateTime AS date) as date, COUNT(a) as total, " +
           "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed, " +
           "SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled " +
           "FROM Appointment a WHERE a.dateTime >= :since GROUP BY CAST(a.dateTime AS date) ORDER BY CAST(a.dateTime AS date)")
    List<Object[]> findAppointmentTrendsSince(@Param("since") LocalDateTime since);
}
