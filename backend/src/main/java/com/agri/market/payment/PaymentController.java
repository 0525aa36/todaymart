package com.agri.market.payment;

import com.agri.market.dto.RefundRequest;
import com.agri.market.dto.WebhookRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{orderId}/request")
    public ResponseEntity<Payment> requestPayment(@PathVariable Long orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        Payment payment = paymentService.requestPayment(orderId, userEmail);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody WebhookRequest webhookRequest,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String webhookSecret) {
        paymentService.handleWebhook(webhookRequest, webhookSecret);
        return ResponseEntity.ok("Webhook received and processed.");
    }

    @PostMapping("/{orderId}/refund")
    public ResponseEntity<?> processRefund(
            @PathVariable Long orderId,
            @Valid @RequestBody RefundRequest refundRequest) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            Payment refundedPayment = paymentService.processRefund(orderId, refundRequest.getRefundReason(), authentication);
            return ResponseEntity.ok(refundedPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getPaymentHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        List<Payment> payments = paymentService.getPaymentHistory(userEmail);
        return ResponseEntity.ok(payments);
    }
}