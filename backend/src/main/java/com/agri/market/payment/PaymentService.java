package com.agri.market.payment;

import com.agri.market.cart.CartRepository;
import com.agri.market.config.TossPaymentsConfig;
import com.agri.market.dto.WebhookRequest;
import com.agri.market.exception.ForbiddenException;
import com.agri.market.exception.UnauthorizedException;
import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderService;
import com.agri.market.order.OrderStatus;
import com.agri.market.order.PaymentStatus;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final TossPaymentsConfig tossPaymentsConfig;
    private final RestTemplate restTemplate;

    @Value("${payment.webhook.secret}")
    private String webhookSecret;

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final long WEBHOOK_TIMESTAMP_TOLERANCE_MS = 300000; // 5 minutes

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository,
                         OrderService orderService, UserRepository userRepository,
                         CartRepository cartRepository, TossPaymentsConfig tossPaymentsConfig,
                         RestTemplate restTemplate) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.tossPaymentsConfig = tossPaymentsConfig;
        this.restTemplate = restTemplate;
    }

    /**
     * HMAC-SHA256 서명 검증
     * @param payload 원본 요청 본문
     * @param providedSignature 클라이언트가 제공한 서명
     * @param timestamp 타임스탬프 (밀리초)
     * @return 검증 성공 여부
     */
    private boolean verifyWebhookSignature(String payload, String providedSignature, Long timestamp) {
        // 1. Timestamp 검증 (Replay Attack 방지)
        if (timestamp != null) {
            long currentTime = System.currentTimeMillis();
            long timeDiff = Math.abs(currentTime - timestamp);

            if (timeDiff > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
                throw new UnauthorizedException("Webhook timestamp is too old. Possible replay attack.");
            }
        }

        // 2. HMAC-SHA256 서명 계산
        try {
            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(
                webhookSecret.getBytes(StandardCharsets.UTF_8),
                HMAC_ALGORITHM
            );
            hmac.init(secretKey);

            // Payload + Timestamp를 포함한 서명 계산
            String signaturePayload = timestamp != null ? payload + timestamp : payload;
            byte[] signatureBytes = hmac.doFinal(signaturePayload.getBytes(StandardCharsets.UTF_8));
            String calculatedSignature = bytesToHex(signatureBytes);

            // 3. Constant-time 비교 (Timing Attack 방지)
            return MessageDigest.isEqual(
                calculatedSignature.getBytes(StandardCharsets.UTF_8),
                providedSignature.getBytes(StandardCharsets.UTF_8)
            );

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to verify webhook signature", e);
        }
    }

    /**
     * 바이트 배열을 16진수 문자열로 변환
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    @RateLimiter(name = "payment")
    @Transactional
    public Payment requestPayment(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 권한 검증: 주문 주인만 결제 요청 가능
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("You are not authorized to request payment for this order");
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new RuntimeException("Payment already processed for order: " + orderId);
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionId("MOCK_TXN_" + System.currentTimeMillis());
        paymentRepository.save(payment);

        return payment;
    }

    /**
     * Webhook 처리 (HMAC-SHA256 서명 검증 포함)
     * @param webhookRequest Webhook 요청 데이터
     * @param requestBody 원본 요청 본문 (JSON 문자열)
     * @param providedSignature 클라이언트가 제공한 HMAC 서명
     * @param timestamp Webhook 타임스탬프 (밀리초)
     */
    @Transactional
    public void handleWebhook(WebhookRequest webhookRequest, String requestBody,
                             String providedSignature, Long timestamp) {
        // HMAC-SHA256 서명 검증
        if (providedSignature == null || providedSignature.trim().isEmpty()) {
            throw new UnauthorizedException("Missing webhook signature");
        }

        boolean isValid = verifyWebhookSignature(requestBody, providedSignature, timestamp);
        if (!isValid) {
            throw new UnauthorizedException("Invalid webhook signature");
        }

        Order order = orderRepository.findById(webhookRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + webhookRequest.getOrderId()));

        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + webhookRequest.getOrderId()));

        if ("PAID".equalsIgnoreCase(webhookRequest.getStatus())) {
            order.setOrderStatus(OrderStatus.PAID);
            payment.setStatus(PaymentStatus.PAID);
            logger.info("Webhook: Payment PAID for order {}", webhookRequest.getOrderId());

            // 결제 완료 시 장바구니 삭제
            cartRepository.findByUser(order.getUser()).ifPresent(cart -> {
                cartRepository.delete(cart);
                logger.info("Cart cleared for user {} after successful payment", order.getUser().getEmail());
            });
        } else if ("FAILED".equalsIgnoreCase(webhookRequest.getStatus())) {
            order.setOrderStatus(OrderStatus.PAYMENT_FAILED);
            payment.setStatus(PaymentStatus.FAILED);
            orderService.restoreStock(order.getId());
            logger.info("Webhook: Payment FAILED for order {}, restoring stock", webhookRequest.getOrderId());
        } else if ("CANCELLED".equalsIgnoreCase(webhookRequest.getStatus()) ||
                   "CANCELED".equalsIgnoreCase(webhookRequest.getStatus())) {
            // 토스에서 결제 취소된 경우
            order.setOrderStatus(OrderStatus.CANCELLED);
            payment.setStatus(PaymentStatus.FAILED);

            // 취소 정보 저장
            if (webhookRequest.getCancellationReason() != null) {
                order.setCancellationReason(webhookRequest.getCancellationReason());
                payment.setRefundReason(webhookRequest.getCancellationReason());
            }
            order.setCancelledAt(LocalDateTime.now());
            payment.setRefundedAt(LocalDateTime.now());

            // 재고 복구
            orderService.restoreStock(order.getId());
            logger.info("Webhook: Payment CANCELLED for order {}, restoring stock. Reason: {}",
                       webhookRequest.getOrderId(), webhookRequest.getCancellationReason());
        }

        if (webhookRequest.getTransactionId() != null && !webhookRequest.getTransactionId().isEmpty()) {
            payment.setTransactionId(webhookRequest.getTransactionId());
        }

        orderRepository.save(order);
        paymentRepository.save(payment);

        logger.info("Webhook processed successfully for order {} with status {}",
                   webhookRequest.getOrderId(), webhookRequest.getStatus());
    }

    /**
     * 결제 환불 처리 (ADMIN 전용) - 전액 환불
     */
    @Transactional
    public Payment processRefund(Long orderId, String refundReason, Authentication authentication) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        return processRefund(orderId, payment.getAmount(), refundReason, authentication);
    }

    /**
     * 결제 환불 처리 (ADMIN 전용) - 부분/전액 환불 지원
     * @param orderId 주문 ID
     * @param refundAmount 환불 금액
     * @param refundReason 환불 사유
     * @param authentication 인증 정보
     * @return 업데이트된 Payment 엔티티
     */
    @Transactional
    public Payment processRefund(Long orderId, BigDecimal refundAmount, String refundReason, Authentication authentication) {
        // ADMIN 권한 검증
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new ForbiddenException("Only administrators can process refunds");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new RuntimeException("Cannot refund: Payment is not in PAID status");
        }

        // 부분 환불 검증
        validateRefundAmount(payment, refundAmount);

        // Toss Payments API를 통한 실제 환불 처리
        String paymentKey = payment.getTransactionId();
        Map<String, Object> cancelResult = callTossCancelApi(paymentKey, refundAmount, refundReason);

        // 환불 정보 업데이트
        BigDecimal currentRefundAmount = payment.getRefundAmount() != null
            ? payment.getRefundAmount()
            : BigDecimal.ZERO;
        BigDecimal newRefundAmount = currentRefundAmount.add(refundAmount);

        payment.setRefundAmount(newRefundAmount);
        payment.setRefundedAt(LocalDateTime.now());
        payment.setRefundTransactionId((String) cancelResult.get("transactionKey"));
        payment.setRefundReason(refundReason);

        // 전액 환불 시에만 주문 취소 처리
        if (newRefundAmount.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
        }

        paymentRepository.save(payment);
        orderRepository.save(order);

        logger.info("Refund processed successfully - OrderId: {}, Amount: {}, Total Refunded: {}",
                    orderId, refundAmount, newRefundAmount);

        return payment;
    }

    /**
     * 부분 환불 금액 검증
     */
    private void validateRefundAmount(Payment payment, BigDecimal refundAmount) {
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Refund amount must be greater than 0");
        }

        BigDecimal currentRefundAmount = payment.getRefundAmount() != null
            ? payment.getRefundAmount()
            : BigDecimal.ZERO;

        BigDecimal totalRefundAmount = currentRefundAmount.add(refundAmount);

        if (totalRefundAmount.compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException(
                String.format("Total refund amount (%s) cannot exceed payment amount (%s)",
                    totalRefundAmount, payment.getAmount())
            );
        }
    }

    /**
     * Toss Payments 환불 API 호출 (Public - OrderService에서 사용)
     * @param paymentKey 결제 키
     * @param cancelAmount 취소 금액
     * @param cancelReason 취소 사유
     * @return API 응답 결과
     */
    public Map<String, Object> callTossCancelApiPublic(String paymentKey, BigDecimal cancelAmount, String cancelReason) {
        return callTossCancelApi(paymentKey, cancelAmount, cancelReason);
    }

    /**
     * Toss Payments 환불 API 호출 (내부 메서드)
     * @param paymentKey 결제 키
     * @param cancelAmount 취소 금액
     * @param cancelReason 취소 사유
     * @return API 응답 결과
     */
    private Map<String, Object> callTossCancelApi(String paymentKey, BigDecimal cancelAmount, String cancelReason) {
        try {
            logger.info("Calling Toss cancel API - PaymentKey: ***, Amount: {}", cancelAmount);

            // Basic Auth 헤더 생성
            String auth = tossPaymentsConfig.getSecretKey() + ":";
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + encodedAuth);

            // 요청 바디
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("cancelReason", cancelReason);
            requestBody.put("cancelAmount", cancelAmount.intValue());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Toss Payments 환불 API 호출
            String url = tossPaymentsConfig.getApiUrl() + "/v1/payments/" + paymentKey + "/cancel";
            logger.debug("Toss cancel API URL: {}", url);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> result = response.getBody();
                logger.info("Toss cancel API succeeded - TransactionKey: {}", result.get("transactionKey"));
                return result;
            } else {
                throw new RuntimeException("Toss cancel API failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Toss cancel API call failed - PaymentKey: ***, Amount: {}", cancelAmount, e);
            throw new RuntimeException("Failed to cancel payment via Toss API: " + e.getMessage(), e);
        }
    }

    /**
     * 사용자별 결제 내역 조회
     * @param userEmail 사용자 이메일
     * @return 결제 내역 리스트
     */
    public List<Payment> getPaymentHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
        return paymentRepository.findByUser(user);
    }

    /**
     * 토스페이먼츠 결제 승인 요청
     * @param paymentKey 결제 키
     * @param orderId 주문 번호 (orderNumber, 토스페이먼츠에서 리다이렉트한 값)
     * @param amount 결제 금액
     * @return 승인 결과
     */
    @RateLimiter(name = "payment")
    @Transactional
    public Map<String, Object> confirmTossPayment(String paymentKey, String orderId, BigDecimal amount) {
        try {
            logger.info("Processing payment confirmation for orderId: {}", orderId);
            logger.debug("Payment amount: {}", amount);
            // SECURITY: Never log payment keys or sensitive payment information

            // orderId는 orderNumber 형식 (ORDER_1234567890)
            // OrderRepository에서 orderNumber로 조회
            Order order = orderRepository.findByOrderNumber(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found with orderNumber: " + orderId));

            logger.debug("Found order with ID: {}", order.getId());

            // Basic Auth 헤더 생성 (Secret Key:)
            String auth = tossPaymentsConfig.getSecretKey() + ":";
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + encodedAuth);

            // 요청 바디 - orderId (orderNumber) 사용
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("paymentKey", paymentKey);
            requestBody.put("orderId", orderId);  // 토스가 준 orderId 그대로 사용
            requestBody.put("amount", amount.intValue());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 토스페이먼츠 API 호출
            String url = tossPaymentsConfig.getApiUrl() + "/v1/payments/confirm";
            logger.debug("Calling Toss API: {}", url);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> result = response.getBody();
                logger.info("Payment confirmed successfully for orderId: {}", orderId);

                // DB에 결제 정보 저장
                Payment payment = new Payment();
                payment.setOrder(order);
                payment.setUser(order.getUser());
                payment.setMethod("TOSS_PAYMENTS");
                payment.setTransactionId(paymentKey);
                payment.setAmount(amount);
                payment.setStatus(PaymentStatus.PAID);
                payment.setApprovedAt(LocalDateTime.now());
                paymentRepository.save(payment);

                // 주문 상태 업데이트
                order.setOrderStatus(OrderStatus.PAID);
                orderRepository.save(order);

                // 결제 완료 시 장바구니 삭제
                cartRepository.findByUser(order.getUser()).ifPresent(cart -> {
                    cartRepository.delete(cart);
                    logger.info("Cart cleared for user {} after payment confirmation", order.getUser().getEmail());
                });

                return result;
            } else {
                throw new RuntimeException("Payment confirmation failed");
            }
        } catch (Exception e) {
            logger.error("Payment confirmation failed for orderId: {}", orderId, e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
    }
}