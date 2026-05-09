package com.smartcare.service;

import com.smartcare.exception.BadRequestException;
import com.smartcare.exception.UnauthorizedException;
import com.smartcare.model.entity.AppUser;
import com.smartcare.model.entity.Patient;
import com.smartcare.model.enums.RoleEnum;
import com.smartcare.repository.AppUserRepository;
import com.smartcare.repository.PatientRepository;
import com.smartcare.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> login(String email, String password) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("user", mapUser(user));
        return result;
    }

    @Transactional
    public Map<String, Object> register(String name, String email, String password, String role, String phoneNumber) {
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        if ("ADMIN".equalsIgnoreCase(role)) {
            throw new BadRequestException("Admin accounts cannot be created from signup");
        }

        RoleEnum roleEnum;
        try {
            roleEnum = RoleEnum.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + role);
        }

        AppUser user = AppUser.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(roleEnum)
                .phoneNumber(phoneNumber)
                .build();

        user = userRepository.save(user);

        if (roleEnum == RoleEnum.PATIENT) {
            Patient patient = Patient.builder()
                    .user(user)
                    .build();
            patientRepository.save(patient);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("user", mapUser(user));
        return result;
    }

    public Map<String, Object> getMe(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return mapUser(user);
    }

    public static Map<String, Object> mapUser(AppUser user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", user.getUserId());
        m.put("name", user.getName());
        m.put("email", user.getEmail());
        m.put("role", user.getRole().name());
        m.put("isActive", user.getIsActive());
        m.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        m.put("phoneNumber", user.getPhoneNumber());
        return m;
    }
}
