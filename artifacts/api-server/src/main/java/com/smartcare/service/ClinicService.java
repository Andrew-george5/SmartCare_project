package com.smartcare.service;

import com.smartcare.exception.BadRequestException;
import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Clinic;
import com.smartcare.model.entity.ClinicReservation;
import com.smartcare.model.entity.Doctor;
import com.smartcare.repository.ClinicRepository;
import com.smartcare.repository.ClinicReservationRepository;
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
public class ClinicService {

    private final ClinicRepository clinicRepository;
    private final ClinicReservationRepository reservationRepository;
    private final DoctorRepository doctorRepository;

    public List<Map<String, Object>> listClinics() {
        return clinicRepository.findAll().stream().map(this::mapClinic).collect(Collectors.toList());
    }

    public Map<String, Object> getClinicById(Integer id) {
        return mapClinic(clinicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found: " + id)));
    }

    @Transactional
    public Map<String, Object> createClinic(Map<String, String> body) {
        Clinic c = Clinic.builder().type(body.get("type")).build();
        return mapClinic(clinicRepository.save(c));
    }

    public List<Map<String, Object>> listReservations(Integer doctorId, Integer clinicId, String day) {
        List<ClinicReservation> list;
        if (doctorId != null && day != null) {
            list = reservationRepository.findByDoctorDoctorIdAndDay(doctorId, day);
        } else if (doctorId != null) {
            list = reservationRepository.findByDoctorDoctorId(doctorId);
        } else if (clinicId != null && day != null) {
            list = reservationRepository.findByClinicClinicIdAndDay(clinicId, day);
        } else if (clinicId != null) {
            list = reservationRepository.findByClinicClinicId(clinicId);
        } else if (day != null) {
            list = reservationRepository.findByDay(day);
        } else {
            list = reservationRepository.findAll();
        }
        return list.stream().map(this::mapReservation).collect(Collectors.toList());
    }

    @Transactional
    public void deleteReservation(Integer id) {
        if (!reservationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reservation not found: " + id);
        }
        reservationRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> createReservation(Map<String, Object> body) {
        Integer clinicId = (Integer) body.get("clinicId");
        Integer doctorId = (Integer) body.get("doctorId");
        String day       = (String) body.get("day");
        String startHour = (String) body.get("startHour");
        String endHour   = (String) body.get("endHour");
        Integer maxPatients = body.get("maxPatients") == null ? 1 : ((Number) body.get("maxPatients")).intValue();

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic not found: " + clinicId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        // Check: clinic already reserved at overlapping time on same day
        boolean clinicConflict = reservationRepository
                .findByClinicClinicIdAndDay(clinicId, day)
                .stream()
                .anyMatch(existing -> timesOverlap(startHour, endHour, existing.getStartHour(), existing.getEndHour()));
        if (clinicConflict) {
            throw new BadRequestException(
                "This clinic is already reserved during that time on " + day +
                ". Please choose a different time or clinic.");
        }

        // Check: doctor already has a reservation at overlapping time on same day
        boolean doctorConflict = reservationRepository
                .findByDoctorDoctorIdAndDay(doctorId, day)
                .stream()
                .anyMatch(existing -> timesOverlap(startHour, endHour, existing.getStartHour(), existing.getEndHour()));
        if (doctorConflict) {
            throw new BadRequestException(
                "This doctor already has a clinic slot that overlaps with " +
                startHour + "–" + endHour + " on " + day + ".");
        }

        ClinicReservation r = ClinicReservation.builder()
                .clinic(clinic)
                .doctor(doctor)
                .day(day)
                .startHour(startHour)
                .endHour(endHour)
                .maxPatients(maxPatients)
                .build();
        return mapReservation(reservationRepository.save(r));
    }

    /**
     * Returns true if [start1, end1) overlaps with [start2, end2).
     * Times are "HH:mm" strings — lexicographic comparison works correctly.
     */
    private boolean timesOverlap(String start1, String end1, String start2, String end2) {
        return start1.compareTo(end2) < 0 && end1.compareTo(start2) > 0;
    }

    private Map<String, Object> mapClinic(Clinic c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("clinicId", c.getClinicId());
        m.put("type", c.getType());
        return m;
    }

    private Map<String, Object> mapReservation(ClinicReservation r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("reservationId", r.getReservationId());
        m.put("clinicId", r.getClinic().getClinicId());
        m.put("clinicType", r.getClinic().getType());
        m.put("doctorId", r.getDoctor().getDoctorId());
        m.put("doctorName", r.getDoctor().getUser().getName());
        m.put("day", r.getDay());
        m.put("startHour", r.getStartHour());
        m.put("endHour", r.getEndHour());
        m.put("maxPatients", r.getMaxPatients());
        return m;
    }
}
