package com.smartcare.service;

import com.smartcare.model.enums.AppointmentStatus;
import com.smartcare.model.enums.InvoiceStatus;
import com.smartcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardService {

    private final AppUserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;

    public Map<String, Object> getStats() {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPatients", patientRepository.count());
        stats.put("totalDoctors", doctorRepository.count());
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("pendingAppointments", appointmentRepository.countByStatus(AppointmentStatus.PENDING));
        stats.put("completedAppointments", appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));
        stats.put("totalRevenue", invoiceRepository.sumPaidRevenue());
        stats.put("pendingInvoices", invoiceRepository.countByStatus(InvoiceStatus.PENDING));
        stats.put("todayAppointments", appointmentRepository.countByDateRange(todayStart, todayEnd));
        return stats;
    }

    public List<Map<String, Object>> getAppointmentTrends() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<Object[]> rows = appointmentRepository.findAppointmentTrendsSince(since);
        return rows.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", row[0] != null ? row[0].toString() : null);
            m.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            m.put("completed", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            m.put("cancelled", row[3] != null ? ((Number) row[3]).longValue() : 0L);
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRevenueSummary() {
        List<Object[]> rows = invoiceRepository.findMonthlyRevenue();
        return rows.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", row[0] != null ? row[0].toString() : null);
            m.put("revenue", row[1] != null ? row[1] : BigDecimal.ZERO);
            m.put("invoiceCount", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDoctorPerformance() {
        return doctorRepository.findAll().stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("doctorId", d.getDoctorId());
            m.put("doctorName", d.getUser().getName());
            m.put("specialty", d.getSpecialty());
            long total = appointmentRepository.findByDoctorDoctorId(d.getDoctorId()).size();
            long completed = appointmentRepository.findByDoctorDoctorIdAndStatus(d.getDoctorId(), AppointmentStatus.COMPLETED).size();
            m.put("totalAppointments", total);
            m.put("completedAppointments", completed);
            m.put("rating", total > 0 ? Math.round((double) completed / total * 50.0) / 10.0 : null);
            return m;
        }).collect(Collectors.toList());
    }
}
