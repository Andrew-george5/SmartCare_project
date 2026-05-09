package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.*;
import com.smartcare.model.enums.AppointmentStatus;
import com.smartcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository recordRepository;
    private final DrugRepository drugRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceService invoiceService;

    public List<Map<String, Object>> listPrescriptions(Integer patientId, Integer doctorId) {
        List<Prescription> list;
        if (patientId != null) {
            list = prescriptionRepository.findByPatientIdWithDetails(patientId);
        } else if (doctorId != null) {
            list = prescriptionRepository.findByRecordDoctorDoctorId(doctorId);
        } else {
            list = prescriptionRepository.findAll();
        }
        return list.stream().map(this::mapPrescription).collect(Collectors.toList());
    }

    public Map<String, Object> getPrescriptionById(Integer id) {
        return mapPrescription(prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found: " + id)));
    }

    @Transactional
    public Map<String, Object> createPrescription(Map<String, Object> body) {
        Integer recordId = (Integer) body.get("recordId");
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found: " + recordId));

        boolean alreadyExists = prescriptionRepository.findAll().stream()
                .anyMatch(p -> p.getRecord() != null &&
                               p.getRecord().getRecordId().equals(record.getRecordId()));
        if (alreadyExists) {
            throw new IllegalStateException(
                    "A prescription already exists for medical record #" + record.getRecordId());
        }

        if (body.get("issueDate") == null) {
            throw new IllegalArgumentException("issueDate is required");
        }

        Object feeObj = body.get("consultationFee");
        BigDecimal consultationFee = null;
        if (feeObj != null) {
            consultationFee = feeObj instanceof Number
                    ? BigDecimal.valueOf(((Number) feeObj).doubleValue())
                    : new BigDecimal(feeObj.toString());
        }

        Prescription p = Prescription.builder()
                .record(record)
                .issueDate(LocalDate.parse((String) body.get("issueDate")))
                .build();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> drugs = (List<Map<String, Object>>) body.get("drugs");
        if (drugs != null) {
            for (Map<String, Object> drugLine : drugs) {
                Integer drugId = (Integer) drugLine.get("drugId");
                Drug drug = drugRepository.findById(drugId)
                        .orElseThrow(() -> new ResourceNotFoundException("Drug not found: " + drugId));
                PrescriptionDetail detail = PrescriptionDetail.builder()
                        .prescription(p)
                        .drug(drug)
                        .dosage((String) drugLine.get("dosage"))
                        .frequency((String) drugLine.get("frequency"))
                        .duration((String) drugLine.get("duration"))
                        .build();
                p.getDetails().add(detail);
            }
        }

        Prescription saved = prescriptionRepository.save(p);

        if (record.getAppointment() != null) {
            Appointment appointment = record.getAppointment();
            appointment.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(appointment);

            if (consultationFee != null && consultationFee.compareTo(BigDecimal.ZERO) > 0) {
                invoiceService.createInvoiceIfAbsent(appointment, consultationFee);
            }
        }

        return mapPrescription(saved);
    }

    @Transactional
    public Map<String, Object> updatePrescription(Integer id, Map<String, Object> body) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found: " + id));
        if (body.containsKey("issueDate") && body.get("issueDate") != null) {
            p.setIssueDate(LocalDate.parse((String) body.get("issueDate")));
        }
        if (body.containsKey("drugs") && body.get("drugs") != null) {
            p.getDetails().clear();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> drugs = (List<Map<String, Object>>) body.get("drugs");
            for (Map<String, Object> drugLine : drugs) {
                Integer drugId = (Integer) drugLine.get("drugId");
                Drug drug = drugRepository.findById(drugId)
                        .orElseThrow(() -> new ResourceNotFoundException("Drug not found: " + drugId));
                PrescriptionDetail detail = PrescriptionDetail.builder()
                        .prescription(p)
                        .drug(drug)
                        .dosage((String) drugLine.get("dosage"))
                        .frequency((String) drugLine.get("frequency"))
                        .duration((String) drugLine.get("duration"))
                        .build();
                p.getDetails().add(detail);
            }
        }
        return mapPrescription(prescriptionRepository.save(p));
    }

    public Map<String, Object> mapPrescription(Prescription p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("prescriptionId", p.getPrescriptionId());
        m.put("recordId", p.getRecord().getRecordId());
        m.put("appointmentId", p.getRecord().getAppointment() != null ? p.getRecord().getAppointment().getAppointmentId() : null);
        m.put("patientName", p.getRecord().getPatient().getUser().getName());
        m.put("doctorName", p.getRecord().getDoctor().getUser().getName());
        m.put("issueDate", p.getIssueDate() != null ? p.getIssueDate().toString() : null);
        List<Map<String, Object>> drugLines = p.getDetails().stream().map(d -> {
            Map<String, Object> dl = new LinkedHashMap<>();
            dl.put("drugId", d.getDrug().getDrugId());
            dl.put("drugName", d.getDrug().getDrugName());
            dl.put("dosage", d.getDosage());
            dl.put("frequency", d.getFrequency());
            dl.put("duration", d.getDuration());
            return dl;
        }).collect(Collectors.toList());
        m.put("drugs", drugLines);
        return m;
    }
}