package com.smartcare.repository;

import com.smartcare.model.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    Optional<Doctor> findByUserUserId(Integer userId);
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);

    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.specialty) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Doctor> searchDoctors(@Param("search") String search);
}
