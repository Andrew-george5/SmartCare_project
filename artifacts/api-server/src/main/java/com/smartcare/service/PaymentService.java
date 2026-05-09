package com.smartcare.service;

import com.smartcare.exception.ResourceNotFoundException;
import com.smartcare.model.entity.Invoice;
import com.smartcare.model.entity.Payment;
import com.smartcare.model.enums.InvoiceStatus;
import com.smartcare.model.enums.PaymentMethod;
import com.smartcare.repository.InvoiceRepository;
import com.smartcare.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public List<Map<String, Object>> listPayments(Integer invoiceId) {
        List<Payment> list = (invoiceId != null)
                ? paymentRepository.findByInvoiceInvoiceId(invoiceId)
                : paymentRepository.findAll();
        return list.stream().map(this::mapPayment).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createPayment(Map<String, Object> body) {
        Integer invoiceId = (Integer) body.get("invoiceId");
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        Object amtObj = body.get("amount");
        BigDecimal amount = amtObj instanceof Number
                ? BigDecimal.valueOf(((Number) amtObj).doubleValue())
                : new BigDecimal((String) amtObj);

        Payment p = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .method(PaymentMethod.valueOf(((String) body.get("method")).toUpperCase()))
                .paymentDate(LocalDateTime.now())
                .build();

        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        return mapPayment(paymentRepository.save(p));
    }

    public Map<String, Object> mapPayment(Payment p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("paymentId", p.getPaymentId());
        m.put("invoiceId", p.getInvoice().getInvoiceId());
        m.put("paymentDate", p.getPaymentDate() != null ? p.getPaymentDate().toString() : null);
        m.put("amount", p.getAmount());
        m.put("method", p.getMethod().name());
        m.put("receiptPdfUrl", p.getReceiptPdfUrl());
        return m;
    }
}
