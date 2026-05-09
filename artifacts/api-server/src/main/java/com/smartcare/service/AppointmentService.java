package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Appointment;
import com.smartcare.model.entity.Doctor;
import com.smartcare.model.entity.Patient;
import com.smartcare.model.enums.AppointmentStatus;
import com.smartcare.model.enums.RoleEnum;
import com.smartcare.repository.AppointmentRepository;
import com.smartcare.repository.AppUserRepository;
import com.smartcare.repository.DoctorRepository;
import com.smartcare.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;

    public List<Map<String, Object>> listAppointments(Integer patientId, Integer doctorId, String status, String date) {
        List<Appointment> list;
        if (patientId != null && status != null) {
            list = appointmentRepository.findByPatientPatientIdAndStatus(patientId, AppointmentStatus.valueOf(status.toUpperCase()));
        } else if (doctorId != null && status != null) {
            list = appointmentRepository.findByDoctorDoctorIdAndStatus(doctorId, AppointmentStatus.valueOf(status.toUpperCase()));
        } else if (patientId != null) {
            list = appointmentRepository.findByPatientPatientId(patientId);
        } else if (doctorId != null) {
            list = appointmentRepository.findByDoctorDoctorId(doctorId);
        } else if (status != null) {
            list = appointmentRepository.findByStatus(AppointmentStatus.valueOf(status.toUpperCase()));
        } else {
            list = appointmentRepository.findAll();
        }
        return list.stream().map(this::mapAppointment).collect(Collectors.toList());
    }

    public Map<String, Object> getAppointmentById(Integer id) {
        return mapAppointment(appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id)));
    }

    @Transactional
    public Map<String, Object> createAppointment(Map<String, Object> body) {
        Integer patientId = toInteger(body.get("patientId"));
        Integer doctorId = toInteger(body.get("doctorId"));
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        String dateTimeStr = (String) body.get("dateTime");
        LocalDateTime dateTime = parseDateTime(dateTimeStr);

        Appointment a = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .dateTime(dateTime)
                .notes((String) body.get("notes"))
                .status(AppointmentStatus.PENDING)
                .build();
        Appointment saved = appointmentRepository.save(a);

        // Notify the doctor
        Integer doctorUserId = doctor.getUser().getUserId();
        String patientName = patient.getUser().getName();
        notificationService.createNotification(doctorUserId, "APPOINTMENT",
                "New appointment request from " + patientName + " on " + dateTime.toLocalDate());

        // Notify all admins
        userRepository.findByRole(RoleEnum.ADMIN).forEach(admin ->
                notificationService.createNotification(admin.getUserId(), "APPOINTMENT",
                        "New appointment booked: " + patientName + " with Dr. " + doctor.getUser().getName()));

        return mapAppointment(saved);
    }

    @Transactional
    public Map<String, Object> updateAppointment(Integer id, Map<String, Object> body) {
        Appointment a = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        AppointmentStatus previousStatus = a.getStatus();

        if (body.containsKey("status") && body.get("status") != null) {
            AppointmentStatus newStatus = AppointmentStatus.valueOf(((String) body.get("status")).toUpperCase());
            a.setStatus(newStatus);

            // Notify patient when doctor accepts or rejects
            Integer patientUserId = a.getPatient().getUser().getUserId();
            String doctorName = a.getDoctor().getUser().getName();
            String dateStr = a.getDateTime() != null ? a.getDateTime().toLocalDate().toString() : "";

            if (newStatus == AppointmentStatus.CONFIRMED && previousStatus == AppointmentStatus.PENDING) {
                notificationService.createNotification(patientUserId, "APPOINTMENT",
                        "Dr. " + doctorName + " has accepted your appointment on " + dateStr);
            } else if (newStatus == AppointmentStatus.CANCELLED) {
                notificationService.createNotification(patientUserId, "APPOINTMENT",
                        "Dr. " + doctorName + " has declined your appointment on " + dateStr);
            }
        }
        if (body.containsKey("notes")) a.setNotes((String) body.get("notes"));
        if (body.containsKey("dateTime") && body.get("dateTime") != null)
            a.setDateTime(parseDateTime((String) body.get("dateTime")));
        return mapAppointment(appointmentRepository.save(a));
    }

    @Transactional
    public Map<String, Object> cancelAppointment(Integer id) {
        Appointment a = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
        AppointmentStatus prevStatus = a.getStatus();
        a.setStatus(AppointmentStatus.CANCELLED);

        Integer patientUserId = a.getPatient().getUser().getUserId();
        String doctorName = a.getDoctor().getUser().getName();
        String dateStr = a.getDateTime() != null ? a.getDateTime().toLocalDate().toString() : "";
        if (prevStatus == AppointmentStatus.PENDING) {
            notificationService.createNotification(patientUserId, "APPOINTMENT",
                    "Dr. " + doctorName + " has declined your appointment on " + dateStr);
        } else {
            notificationService.createNotification(patientUserId, "APPOINTMENT",
                    "Your appointment with Dr. " + doctorName + " on " + dateStr + " has been cancelled");
        }

        return mapAppointment(appointmentRepository.save(a));
    }

    public Map<String, Object> mapAppointment(Appointment a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("appointmentId", a.getAppointmentId());
        m.put("patientId", a.getPatient().getPatientId());
        m.put("patientName", a.getPatient().getUser().getName());
        m.put("doctorId", a.getDoctor().getDoctorId());
        m.put("doctorName", a.getDoctor().getUser().getName());
        m.put("doctorSpecialty", a.getDoctor().getSpecialty());
        m.put("dateTime", a.getDateTime() != null ? a.getDateTime().toString() : null);
        m.put("status", a.getStatus().name());
        m.put("notes", a.getNotes());
        return m;
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null) return null;
        try {
            // Handle ISO 8601 strings like "2024-01-15T10:30:00.000Z"
            if (dateTimeStr.endsWith("Z") || dateTimeStr.contains("+")) {
                return Instant.parse(dateTimeStr).atZone(ZoneOffset.UTC).toLocalDateTime();
            }
            return LocalDateTime.parse(dateTimeStr);
        } catch (Exception e) {
            // Try stripping trailing Z and milliseconds
            String cleaned = dateTimeStr.replaceAll("Z$", "").replaceAll("\\.\\d+$", "");
            return LocalDateTime.parse(cleaned);
        }
    }

    private Integer toInteger(Object val) {
        if (val == null) return null;
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        return Integer.parseInt(val.toString());
    }
}
