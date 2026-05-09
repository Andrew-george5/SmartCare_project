package com.smartcare.service;

import com.smartcare.exception.BadRequestException;
import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.exception.UnauthorizedException;
import com.smartcare.model.entity.AppUser;
import com.smartcare.model.enums.RoleEnum;
import com.smartcare.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Map<String, Object>> listUsers(String role, Boolean isActive) {
        List<AppUser> users;
        if (role != null) {
            users = userRepository.findByRole(RoleEnum.valueOf(role.toUpperCase()));
        } else if (isActive != null) {
            users = userRepository.findByIsActive(isActive);
        } else {
            users = userRepository.findAll();
        }
        return users.stream().map(AuthService::mapUser).collect(Collectors.toList());
    }

    public Map<String, Object> getUserById(Integer id) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return AuthService.mapUser(user);
    }

    public Map<String, Object> createUser(Map<String, String> body) {
        if (userRepository.existsByEmail(body.get("email"))) {
            throw new BadRequestException("Email already exists");
        }
        AppUser user = AppUser.builder()
                .name(body.get("name"))
                .email(body.get("email"))
                .password(passwordEncoder.encode(body.get("password")))
                .role(RoleEnum.valueOf(body.get("role").toUpperCase()))
                .phoneNumber(body.get("phoneNumber"))
                .isActive(true)
                .build();
        return AuthService.mapUser(userRepository.save(user));
    }

    public Map<String, Object> updateUser(Integer id, Map<String, Object> body) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (body.containsKey("name")) user.setName((String) body.get("name"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("phoneNumber")) user.setPhoneNumber((String) body.get("phoneNumber"));
        if (body.containsKey("isActive")) user.setIsActive((Boolean) body.get("isActive"));
        return AuthService.mapUser(userRepository.save(user));
    }

    public Map<String, Object> deactivateUser(Integer id) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setIsActive(false);
        return AuthService.mapUser(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
