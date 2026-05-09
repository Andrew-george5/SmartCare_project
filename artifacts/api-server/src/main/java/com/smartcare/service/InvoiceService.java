package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Appointment;
import com.smartcare.model.entity.Invoice;
import com.smartcare.model.enums.InvoiceStatus;
import com.smartcare.repository.AppointmentRepository;
import com.smartcare.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final PlatformSettingsService platformSettingsService;

    public List<Map<String, Object>> listInvoices(String status, Integer patientId, Integer doctorId) {
        List<Invoice> list;
        if (patientId != null) {
            list = invoiceRepository.findByAppointmentPatientPatientId(patientId);
            if (status != null && !status.isBlank()) {
                InvoiceStatus s = InvoiceStatus.valueOf(status.toUpperCase());
                list = list.stream().filter(i -> i.getStatus() == s).collect(Collectors.toList());
            }
        } else if (doctorId != null) {
            list = invoiceRepository.findByAppointmentDoctorDoctorId(doctorId);
            if (status != null && !status.isBlank()) {
                InvoiceStatus s = InvoiceStatus.valueOf(status.toUpperCase());
                list = list.stream().filter(i -> i.getStatus() == s).collect(Collectors.toList());
            }
        } else if (status != null && !status.isBlank()) {
            list = invoiceRepository.findByStatus(InvoiceStatus.valueOf(status.toUpperCase()));
        } else {
            list = invoiceRepository.findAll();
        }
        return list.stream().map(this::mapInvoice).collect(Collectors.toList());
    }

    public Map<String, Object> getInvoiceById(Integer id) {
        return mapInvoice(invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id)));
    }

    @Transactional
    public Map<String, Object> createInvoice(Map<String, Object> body) {
        Object apptObj = body.get("appointmentId");
        if (apptObj == null) throw new IllegalArgumentException("appointmentId is required");
        Integer appointmentId = apptObj instanceof Number ? ((Number) apptObj).intValue() : Integer.parseInt(apptObj.toString());

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (invoiceRepository.findByAppointmentAppointmentId(appointmentId).isPresent()) {
            throw new IllegalStateException("An invoice already exists for appointment #" + appointmentId);
        }

        Object amtObj = body.get("totalAmount");
        if (amtObj == null) throw new IllegalArgumentException("totalAmount is required");
        BigDecimal totalAmount = amtObj instanceof Number
                ? BigDecimal.valueOf(((Number) amtObj).doubleValue())
                : new BigDecimal(amtObj.toString());

        BigDecimal feePercent = platformSettingsService.getCurrentFeePercent();
        BigDecimal platformFee = totalAmount.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal netAmount = totalAmount.subtract(platformFee);

        Invoice inv = Invoice.builder()
                .appointment(appointment)
                .issueDate(LocalDate.now())
                .totalAmount(totalAmount)
                .platformFee(platformFee)
                .netAmount(netAmount)
                .status(InvoiceStatus.PENDING)
                .build();

        return mapInvoice(invoiceRepository.save(inv));
    }

    /**
     * Creates an invoice if one doesn't already exist for the appointment.
     * Returns the existing invoice map if a duplicate would occur (idempotent).
     */
    @Transactional
    public Map<String, Object> createInvoiceIfAbsent(Appointment appointment, BigDecimal totalAmount) {
        return invoiceRepository.findByAppointmentAppointmentId(appointment.getAppointmentId())
                .map(this::mapInvoice)
                .orElseGet(() -> {
                    BigDecimal feePercent = platformSettingsService.getCurrentFeePercent();
                    BigDecimal platformFee = totalAmount.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    BigDecimal netAmount = totalAmount.subtract(platformFee);

                    Invoice inv = Invoice.builder()
                            .appointment(appointment)
                            .issueDate(LocalDate.now())
                            .totalAmount(totalAmount)
                            .platformFee(platformFee)
                            .netAmount(netAmount)
                            .status(InvoiceStatus.PENDING)
                            .build();
                    return mapInvoice(invoiceRepository.save(inv));
                });
    }

    @Transactional
    public Map<String, Object> updateInvoice(Integer id, Map<String, Object> body) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        if (body.containsKey("status") && body.get("status") != null)
            inv.setStatus(InvoiceStatus.valueOf(((String) body.get("status")).toUpperCase()));
        if (body.containsKey("totalAmount") && body.get("totalAmount") != null) {
            Object amt = body.get("totalAmount");
            if (amt instanceof Number) inv.setTotalAmount(BigDecimal.valueOf(((Number) amt).doubleValue()));
        }
        return mapInvoice(invoiceRepository.save(inv));
    }

    public Map<String, Object> mapInvoice(Invoice inv) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("invoiceId", inv.getInvoiceId());
        m.put("appointmentId", inv.getAppointment().getAppointmentId());
        m.put("patientName", inv.getAppointment().getPatient().getUser().getName());
        m.put("doctorName", inv.getAppointment().getDoctor().getUser().getName());
        m.put("issueDate", inv.getIssueDate() != null ? inv.getIssueDate().toString() : null);
        m.put("totalAmount", inv.getTotalAmount());
        m.put("platformFee", inv.getPlatformFee());
        m.put("netAmount", inv.getNetAmount());
        m.put("status", inv.getStatus().name());
        return m;
    }
}
