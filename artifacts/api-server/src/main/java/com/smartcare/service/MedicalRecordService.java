package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Appointment;
import com.smartcare.model.entity.Doctor;
import com.smartcare.model.entity.MedicalRecord;
import com.smartcare.model.entity.Patient;
import com.smartcare.model.enums.AppointmentStatus;
import com.smartcare.repository.AppointmentRepository;
import com.smartcare.repository.DoctorRepository;
import com.smartcare.repository.MedicalRecordRepository;
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
public class MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public List<Map<String, Object>> listRecords(Integer patientId, Integer doctorId) {
        List<MedicalRecord> list;
        if (patientId != null && doctorId != null) {
            list = recordRepository.findByPatientPatientIdAndDoctorDoctorId(patientId, doctorId);
        } else if (patientId != null) {
            list = recordRepository.findByPatientPatientId(patientId);
        } else if (doctorId != null) {
            list = recordRepository.findByDoctorDoctorId(doctorId);
        } else {
            list = recordRepository.findAll();
        }
        return list.stream().map(this::mapRecord).collect(Collectors.toList());
    }

    public Map<String, Object> getRecordById(Integer id) {
        return mapRecord(recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found: " + id)));
    }

    @Transactional
    public Map<String, Object> createRecord(Map<String, Object> body) {
        Integer patientId = (Integer) body.get("patientId");
        Integer doctorId = (Integer) body.get("doctorId");
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        Appointment appointment = null;
        if (body.get("appointmentId") != null) {
            Appointment found = appointmentRepository.findById((Integer) body.get("appointmentId"))
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + body.get("appointmentId")));
            if (found.getStatus() == AppointmentStatus.CANCELLED) {
                throw new IllegalStateException("Cannot create a medical record for a cancelled appointment");
            }
            final Integer apptId = found.getAppointmentId();
            if (recordRepository.findAll().stream().anyMatch(r -> r.getAppointment() != null && r.getAppointment().getAppointmentId().equals(apptId))) {
                throw new IllegalStateException("A medical record already exists for appointment #" + apptId);
            }
            appointment = found;
        }

        if (body.get("visitDate") == null) {
            throw new IllegalArgumentException("visitDate is required");
        }
        if (body.get("diagnosis") == null || ((String) body.get("diagnosis")).isBlank()) {
            throw new IllegalArgumentException("diagnosis is required");
        }

        MedicalRecord r = MedicalRecord.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .visitDate(LocalDate.parse((String) body.get("visitDate")))
                .diagnosis((String) body.get("diagnosis"))
                .notes((String) body.get("notes"))
                .attachedDocumentUrl((String) body.get("attachedDocumentUrl"))
                .build();
        return mapRecord(recordRepository.save(r));
    }

    @Transactional
    public Map<String, Object> updateRecord(Integer id, Map<String, Object> body) {
        MedicalRecord r = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found: " + id));
        if (body.containsKey("diagnosis")) r.setDiagnosis((String) body.get("diagnosis"));
        if (body.containsKey("notes")) r.setNotes((String) body.get("notes"));
        if (body.containsKey("attachedDocumentUrl")) r.setAttachedDocumentUrl((String) body.get("attachedDocumentUrl"));
        return mapRecord(recordRepository.save(r));
    }

    public Map<String, Object> mapRecord(MedicalRecord r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("recordId", r.getRecordId());
        m.put("patientId", r.getPatient().getPatientId());
        m.put("patientName", r.getPatient().getUser().getName());
        m.put("doctorId", r.getDoctor().getDoctorId());
        m.put("doctorName", r.getDoctor().getUser().getName());
        m.put("appointmentId", r.getAppointment() != null ? r.getAppointment().getAppointmentId() : null);
        m.put("visitDate", r.getVisitDate() != null ? r.getVisitDate().toString() : null);
        m.put("diagnosis", r.getDiagnosis());
        m.put("notes", r.getNotes());
        m.put("attachedDocumentUrl", r.getAttachedDocumentUrl());
        return m;
    }
}
