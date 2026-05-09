package com.smartcare.repository;

import com.smartcare.model.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByInvoiceInvoiceId(Integer invoiceId);
}
