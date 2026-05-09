package com.smartcare.repository;

import com.smartcare.model.entity.AppUser;
import com.smartcare.model.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByEmail(String email);
    List<AppUser> findByRole(RoleEnum role);
    List<AppUser> findByIsActive(Boolean isActive);
    boolean existsByEmail(String email);
}
