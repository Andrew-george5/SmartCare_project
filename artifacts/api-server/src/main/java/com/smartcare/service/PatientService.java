package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.AppUser;
import com.smartcare.model.entity.Patient;
import com.smartcare.repository.AppUserRepository;
import com.smartcare.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AppUserRepository userRepository;

    public Map<String, Object> getPatientByEmail(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Patient p = patientRepository.findByUserUserId(user.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for this user"));
        return mapPatient(p);
    }

    public List<Map<String, Object>> listPatients(String search, Integer doctorId) {
        List<Patient> patients;
        if (doctorId != null) {
            patients = patientRepository.findPatientsByDoctorId(doctorId);
            if (search != null && !search.isBlank()) {
                String lower = search.toLowerCase();
                patients = patients.stream()
                        .filter(p -> p.getUser().getName().toLowerCase().contains(lower)
                                  || p.getUser().getEmail().toLowerCase().contains(lower))
                        .collect(Collectors.toList());
            }
        } else if (search != null && !search.isBlank()) {
            patients = patientRepository.searchPatients(search);
        } else {
            patients = patientRepository.findAll();
        }
        return patients.stream().map(this::mapPatient).collect(Collectors.toList());
    }

    public Map<String, Object> getPatientById(Integer id) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
        return mapPatient(p);
    }

    @Transactional
    public Map<String, Object> createPatient(Map<String, Object> body) {
        Integer userId = (Integer) body.get("userId");
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Patient p = Patient.builder()
                .user(user)
                .dateOfBirth(body.get("dateOfBirth") != null ? LocalDate.parse((String) body.get("dateOfBirth")) : null)
                .gender((String) body.get("gender"))
                .address((String) body.get("address"))
                .bloodType((String) body.get("bloodType"))
                .build();

        return mapPatient(patientRepository.save(p));
    }

    @Transactional
    public Map<String, Object> updatePatient(Integer id, Map<String, Object> body) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
        if (body.containsKey("dateOfBirth") && body.get("dateOfBirth") != null)
            p.setDateOfBirth(LocalDate.parse((String) body.get("dateOfBirth")));
        if (body.containsKey("gender")) p.setGender((String) body.get("gender"));
        if (body.containsKey("address")) p.setAddress((String) body.get("address"));
        if (body.containsKey("bloodType")) p.setBloodType((String) body.get("bloodType"));
        return mapPatient(patientRepository.save(p));
    }

    public Map<String, Object> mapPatient(Patient p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("patientId", p.getPatientId());
        m.put("userId", p.getUser().getUserId());
        m.put("name", p.getUser().getName());
        m.put("email", p.getUser().getEmail());
        m.put("phoneNumber", p.getUser().getPhoneNumber());
        m.put("dateOfBirth", p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : null);
        m.put("gender", p.getGender());
        m.put("address", p.getAddress());
        m.put("bloodType", p.getBloodType());
        return m;
    }
}
