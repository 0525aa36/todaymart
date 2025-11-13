package com.agri.market.payment;

import com.agri.market.dto.RefundRequest;
import com.agri.market.dto.TossPaymentConfirmRequest;
import com.agri.market.dto.WebhookRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Payments", description = "결제 처리 및 환불 API (Toss Payments 연동)")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    public PaymentController(PaymentService paymentService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "결제 요청", description = "주문에 대한 결제를 요청합니다.",
            security = @SecurityRequirement(name = "Bearer Authentication"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "결제 요청 성공",
                    content = @Content(schema = @Schema(implementation = Payment.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 주문 또는 결제 불가 상태"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @PostMapping("/{orderId}/request")
    public ResponseEntity<Payment> requestPayment(
            @Parameter(description = "주문 ID", required = true) @PathVariable Long orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        Payment payment = paymentService.requestPayment(orderId, userEmail);
        return ResponseEntity.ok(payment);
    }

    @Operation(summary = "결제 Webhook",
            description = "Toss Payments 결제 웹훅 엔드포인트. HMAC-SHA256 서명 검증을 통해 요청을 검증합니다. " +
                         "헤더: X-Webhook-Signature (필수), X-Webhook-Timestamp (선택)",
            hidden = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "웹훅 처리 성공"),
            @ApiResponse(responseCode = "400", description = "서명 검증 실패 또는 처리 오류")
    })
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String rawBody,
            @Parameter(description = "HMAC-SHA256 서명", required = true)
            @RequestHeader(value = "X-Webhook-Signature", required = true) String signature,
            @Parameter(description = "타임스탬프 (밀리초)")
            @RequestHeader(value = "X-Webhook-Timestamp", required = false) Long timestamp) {
        try {
            // JSON 문자열을 WebhookRequest 객체로 파싱
            WebhookRequest webhookRequest = objectMapper.readValue(rawBody, WebhookRequest.class);

            // HMAC 검증 및 처리
            paymentService.handleWebhook(webhookRequest, rawBody, signature, timestamp);

            return ResponseEntity.ok("Webhook received and processed.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Webhook processing failed: " + e.getMessage());
        }
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

    @Operation(summary = "Toss Payments 결제 승인", description = "Toss Payments에서 리디렉션된 후 결제를 최종 승인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "결제 승인 성공"),
            @ApiResponse(responseCode = "400", description = "결제 승인 실패")
    })
    @PostMapping("/toss/confirm")
    public ResponseEntity<?> confirmTossPayment(@Valid @RequestBody TossPaymentConfirmRequest request) {
        try {
            Map<String, Object> result = paymentService.confirmTossPayment(
                    request.getPaymentKey(),
                    request.getOrderId(),
                    request.getAmount()
            );
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Payment confirmation failed",
                    "message", e.getMessage()
            ));
        }
    }
}