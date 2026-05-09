package com.smartcare.repository;

import com.smartcare.model.entity.Invoice;
import com.smartcare.model.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByStatus(InvoiceStatus status);
    List<Invoice> findByAppointmentPatientPatientId(Integer patientId);
    List<Invoice> findByAppointmentDoctorDoctorId(Integer doctorId);
    Optional<Invoice> findByAppointmentAppointmentId(Integer appointmentId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status = 'PAID'")
    BigDecimal sumPaidRevenue();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Long countByStatus(InvoiceStatus status);

    @Query("SELECT TO_CHAR(i.issueDate, 'YYYY-MM') as month, SUM(i.totalAmount) as revenue, COUNT(i) as cnt " +
           "FROM Invoice i WHERE i.status = 'PAID' GROUP BY TO_CHAR(i.issueDate, 'YYYY-MM') ORDER BY month")
    List<Object[]> findMonthlyRevenue();
}
