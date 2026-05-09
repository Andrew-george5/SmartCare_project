package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.AppUser;
import com.smartcare.model.entity.Doctor;
import com.smartcare.repository.AppUserRepository;
import com.smartcare.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppUserRepository userRepository;

    public Map<String, Object> getDoctorByEmail(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Doctor d = doctorRepository.findByUserUserId(user.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for this user"));
        return mapDoctor(d);
    }

    public List<Map<String, Object>> listDoctors(String specialty, String search) {
        List<Doctor> doctors;
        if (search != null && !search.isBlank()) {
            doctors = doctorRepository.searchDoctors(search);
        } else if (specialty != null && !specialty.isBlank()) {
            doctors = doctorRepository.findBySpecialtyContainingIgnoreCase(specialty);
        } else {
            doctors = doctorRepository.findAll();
        }
        return doctors.stream().map(this::mapDoctor).collect(Collectors.toList());
    }

    public Map<String, Object> getDoctorById(Integer id) {
        Doctor d = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id));
        return mapDoctor(d);
    }

    @Transactional
    public Map<String, Object> createDoctor(Map<String, Object> body) {
        Integer userId = (Integer) body.get("userId");
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Doctor d = Doctor.builder()
                .user(user)
                .specialty((String) body.get("specialty"))
                .licenseNumber((String) body.get("licenseNumber"))
                .build();
        return mapDoctor(doctorRepository.save(d));
    }

    @Transactional
    public Map<String, Object> updateDoctor(Integer id, Map<String, Object> body) {
        Doctor d = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id));
        if (body.containsKey("specialty")) d.setSpecialty((String) body.get("specialty"));
        if (body.containsKey("licenseNumber")) d.setLicenseNumber((String) body.get("licenseNumber"));
        return mapDoctor(doctorRepository.save(d));
    }

    public Map<String, Object> mapDoctor(Doctor d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("doctorId", d.getDoctorId());
        m.put("userId", d.getUser().getUserId());
        m.put("name", d.getUser().getName());
        m.put("email", d.getUser().getEmail());
        m.put("phoneNumber", d.getUser().getPhoneNumber());
        m.put("specialty", d.getSpecialty());
        m.put("licenseNumber", d.getLicenseNumber());
        return m;
    }
}
