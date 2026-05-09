package com.smartcare.config;

import com.smartcare.model.entity.AppUser;
import com.smartcare.model.enums.RoleEnum;
import com.smartcare.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@smartcare.com")) {
            AppUser admin = AppUser.builder()
                    .name("System Admin")
                    .email("admin@smartcare.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(RoleEnum.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin created: admin@smartcare.com / admin123");
        }
    }
}
