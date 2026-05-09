package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.*;
import com.smartcare.model.enums.AppointmentStatus;
import com.smartcare.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PrescriptionService unit tests")
class PrescriptionServiceTest {

    @Mock PrescriptionRepository prescriptionRepository;
    @Mock MedicalRecordRepository recordRepository;
    @Mock DrugRepository drugRepository;
    @Mock AppointmentRepository appointmentRepository;

    @InjectMocks PrescriptionService prescriptionService;

    // ── fixtures ─────────────────────────────────────────────────────────────

    private AppUser patientUser;
    private AppUser doctorUser;
    private Patient patient;
    private Doctor doctor;
    private Appointment appointment;
    private MedicalRecord record;
    private Drug drug;

    @BeforeEach
    void setUp() {
        patientUser = AppUser.builder().userId(10).name("Alice Patient").email("alice@test.com").build();
        doctorUser  = AppUser.builder().userId(20).name("Bob Doctor").email("bob@test.com").build();

        patient = Patient.builder().patientId(1).user(patientUser).build();
        doctor  = Doctor.builder().doctorId(2).user(doctorUser).specialty("General").build();

        appointment = Appointment.builder()
                .appointmentId(100)
                .patient(patient)
                .doctor(doctor)
                .dateTime(LocalDateTime.now().minusDays(1))
                .status(AppointmentStatus.CONFIRMED)
                .build();

        record = MedicalRecord.builder()
                .recordId(5)
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .visitDate(LocalDate.now().minusDays(1))
                .diagnosis("Fever")
                .build();

        drug = Drug.builder().drugId(99).drugName("Paracetamol").activeIngredients(new ArrayList<>()).build();
    }

    // ── listPrescriptions ─────────────────────────────────────────────────────

    @Test
    @DisplayName("listPrescriptions with doctorId delegates to findByRecordDoctorDoctorId")
    void listPrescriptions_byDoctor() {
        Prescription p = buildPrescription(1, record);
        when(prescriptionRepository.findByRecordDoctorDoctorId(2)).thenReturn(List.of(p));

        List<Map<String, Object>> result = prescriptionService.listPrescriptions(null, 2);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("prescriptionId", 1);
        assertThat(result.get(0)).containsEntry("patientName", "Alice Patient");
        verify(prescriptionRepository).findByRecordDoctorDoctorId(2);
    }

    @Test
    @DisplayName("listPrescriptions with patientId delegates to findByPatientIdWithDetails")
    void listPrescriptions_byPatient() {
        Prescription p = buildPrescription(2, record);
        when(prescriptionRepository.findByPatientIdWithDetails(1)).thenReturn(List.of(p));

        List<Map<String, Object>> result = prescriptionService.listPrescriptions(1, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("prescriptionId", 2);
        verify(prescriptionRepository).findByPatientIdWithDetails(1);
    }

    @Test
    @DisplayName("listPrescriptions with no filter returns findAll")
    void listPrescriptions_noFilter() {
        when(prescriptionRepository.findAll()).thenReturn(List.of());

        List<Map<String, Object>> result = prescriptionService.listPrescriptions(null, null);

        assertThat(result).isEmpty();
        verify(prescriptionRepository).findAll();
    }

    // ── createPrescription ────────────────────────────────────────────────────

    @Test
    @DisplayName("createPrescription succeeds and marks appointment COMPLETED")
    void createPrescription_success_marksAppointmentCompleted() {
        when(recordRepository.findById(5)).thenReturn(Optional.of(record));
        when(prescriptionRepository.findAll()).thenReturn(List.of()); // no existing prescription
        when(drugRepository.findById(99)).thenReturn(Optional.of(drug));
        when(prescriptionRepository.save(any())).thenAnswer(inv -> {
            Prescription saved = inv.getArgument(0);
            saved.setPrescriptionId(10);
            return saved;
        });

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 5);
        body.put("issueDate", LocalDate.now().toString());
        body.put("consultationFee", 50.0);
        body.put("drugs", List.of(Map.of(
                "drugId", 99,
                "dosage", "500mg",
                "frequency", "Twice daily",
                "duration", "5 days"
        )));

        Map<String, Object> result = prescriptionService.createPrescription(body);

        assertThat(result).containsEntry("prescriptionId", 10);
        assertThat(result).containsEntry("appointmentId", 100);
        assertThat(result).containsEntry("patientName", "Alice Patient");

        // appointment must be COMPLETED
        verify(appointmentRepository).save(argThat(a ->
                a.getStatus() == AppointmentStatus.COMPLETED));
    }

    @Test
    @DisplayName("createPrescription throws when medical record does not exist")
    void createPrescription_recordNotFound() {
        when(recordRepository.findById(999)).thenReturn(Optional.empty());

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 999);
        body.put("issueDate", LocalDate.now().toString());
        body.put("consultationFee", 50.0);

        assertThatThrownBy(() -> prescriptionService.createPrescription(body))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("createPrescription throws when a prescription already exists for the same medical record")
    void createPrescription_duplicate_record() {
        Prescription existing = buildPrescription(1, record);
        when(recordRepository.findById(5)).thenReturn(Optional.of(record));
        when(prescriptionRepository.findAll()).thenReturn(List.of(existing));

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 5);
        body.put("issueDate", LocalDate.now().toString());
        body.put("consultationFee", 50.0);

        assertThatThrownBy(() -> prescriptionService.createPrescription(body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("createPrescription throws when issueDate is missing")
    void createPrescription_missingIssueDate() {
        when(recordRepository.findById(5)).thenReturn(Optional.of(record));
        when(prescriptionRepository.findAll()).thenReturn(List.of());

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 5);
        body.put("consultationFee", 50.0);
        // issueDate deliberately omitted

        assertThatThrownBy(() -> prescriptionService.createPrescription(body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("issueDate");
    }

    @Test
    @DisplayName("createPrescription throws when consultationFee is missing")
    void createPrescription_missingConsultationFee() {
        when(recordRepository.findById(5)).thenReturn(Optional.of(record));
        when(prescriptionRepository.findAll()).thenReturn(List.of());

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 5);
        body.put("issueDate", LocalDate.now().toString());
        // consultationFee deliberately omitted

        assertThatThrownBy(() -> prescriptionService.createPrescription(body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("consultationFee");
    }

    @Test
    @DisplayName("createPrescription with no appointment still saves (record without appointment)")
    void createPrescription_recordWithoutAppointment() {
        MedicalRecord recordNoAppt = MedicalRecord.builder()
                .recordId(6)
                .patient(patient)
                .doctor(doctor)
                .appointment(null)
                .visitDate(LocalDate.now())
                .diagnosis("Checkup")
                .build();

        when(recordRepository.findById(6)).thenReturn(Optional.of(recordNoAppt));
        when(prescriptionRepository.findAll()).thenReturn(List.of());
        when(prescriptionRepository.save(any())).thenAnswer(inv -> {
            Prescription saved = inv.getArgument(0);
            saved.setPrescriptionId(11);
            return saved;
        });

        Map<String, Object> body = new HashMap<>();
        body.put("recordId", 6);
        body.put("issueDate", LocalDate.now().toString());
        body.put("consultationFee", 30.0);

        Map<String, Object> result = prescriptionService.createPrescription(body);

        assertThat(result).containsEntry("prescriptionId", 11);
        assertThat(result.get("appointmentId")).isNull();
        // appointmentRepository.save must NOT be called since there is no appointment
        verify(appointmentRepository, never()).save(any());
    }

    // ── updatePrescription ────────────────────────────────────────────────────

    @Test
    @DisplayName("updatePrescription updates issueDate when provided")
    void updatePrescription_updatesIssueDate() {
        Prescription existing = buildPrescription(1, record);
        when(prescriptionRepository.findById(1)).thenReturn(Optional.of(existing));
        when(prescriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> body = new HashMap<>();
        body.put("issueDate", "2026-01-01");

        Map<String, Object> result = prescriptionService.updatePrescription(1, body);

        assertThat(result.get("issueDate")).isEqualTo("2026-01-01");
    }

    @Test
    @DisplayName("updatePrescription throws when prescription not found")
    void updatePrescription_notFound() {
        when(prescriptionRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionService.updatePrescription(999, new HashMap<>()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    // ── mapPrescription ───────────────────────────────────────────────────────

    @Test
    @DisplayName("mapPrescription includes appointmentId, patientName, doctorName, drugs")
    void mapPrescription_includesExpectedFields() {
        Prescription p = buildPrescription(7, record);
        PrescriptionDetail detail = PrescriptionDetail.builder()
                .prescription(p)
                .drug(drug)
                .dosage("10mg")
                .frequency("Once daily")
                .duration("3 days")
                .build();
        p.getDetails().add(detail);

        Map<String, Object> result = prescriptionService.mapPrescription(p);

        assertThat(result)
                .containsEntry("prescriptionId", 7)
                .containsEntry("recordId", 5)
                .containsEntry("appointmentId", 100)
                .containsEntry("patientName", "Alice Patient")
                .containsEntry("doctorName", "Bob Doctor");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> drugs = (List<Map<String, Object>>) result.get("drugs");
        assertThat(drugs).hasSize(1);
        assertThat(drugs.get(0)).containsEntry("drugName", "Paracetamol").containsEntry("dosage", "10mg");
    }

    // ── utilities ─────────────────────────────────────────────────────────────

    private Prescription buildPrescription(int id, MedicalRecord rec) {
        Prescription p = Prescription.builder()
                .record(rec)
                .issueDate(LocalDate.now())
                .build();
        p.setPrescriptionId(id);
        return p;
    }
}
