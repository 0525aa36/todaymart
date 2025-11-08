package com.agri.market.payment;

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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final TossPaymentsConfig tossPaymentsConfig;
    private final RestTemplate restTemplate;

    @Value("${payment.webhook.secret:default-secret-key}")
    private String webhookSecret;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository,
                         OrderService orderService, UserRepository userRepository,
                         TossPaymentsConfig tossPaymentsConfig, RestTemplate restTemplate) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.tossPaymentsConfig = tossPaymentsConfig;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public Payment requestPayment(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 권한 검증: 주문 주인만 결제 요청 가능
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("You are not authorized to request payment for this order");
        }

        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
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

    @Transactional
    public void handleWebhook(WebhookRequest webhookRequest, String providedSecret) {
        // 웹훅 서명 검증
        if (providedSecret == null || !webhookSecret.equals(providedSecret)) {
            throw new UnauthorizedException("Invalid webhook secret");
        }

        Order order = orderRepository.findById(webhookRequest.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + webhookRequest.getOrderId()));

        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + webhookRequest.getOrderId()));

        if ("PAID".equalsIgnoreCase(webhookRequest.getStatus())) {
            order.setOrderStatus(OrderStatus.PAID);
            payment.setStatus(PaymentStatus.PAID);
        } else if ("FAILED".equalsIgnoreCase(webhookRequest.getStatus())) {
            order.setOrderStatus(OrderStatus.PAYMENT_FAILED);
            payment.setStatus(PaymentStatus.FAILED);
            orderService.restoreStock(order.getId());
        }

        if (webhookRequest.getTransactionId() != null && !webhookRequest.getTransactionId().isEmpty()) {
            payment.setTransactionId(webhookRequest.getTransactionId());
        }

        orderRepository.save(order);
        paymentRepository.save(payment);
    }

    /**
     * 결제 환불 처리 (ADMIN 전용)
     */
    @Transactional
    public Payment processRefund(Long orderId, String refundReason, Authentication authentication) {
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

        if (payment.getRefundAmount() != null && payment.getRefundAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Payment already refunded");
        }

        payment.setRefundAmount(payment.getAmount());
        payment.setRefundedAt(java.time.LocalDateTime.now());
        payment.setRefundTransactionId("REFUND_TXN_" + System.currentTimeMillis());
        payment.setRefundReason(refundReason);
        payment.setStatus(PaymentStatus.FAILED);

        order.setOrderStatus(OrderStatus.CANCELLED);

        paymentRepository.save(payment);
        orderRepository.save(order);

        return payment;
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
     * @param orderId 주문 ID (orderId)
     * @param amount 결제 금액
     * @return 승인 결과
     */
    @Transactional
    public Map<String, Object> confirmTossPayment(String paymentKey, String orderId, BigDecimal amount) {
        try {
            // Basic Auth 헤더 생성 (Secret Key:)
            String auth = tossPaymentsConfig.getSecretKey() + ":";
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + encodedAuth);

            // 요청 바디
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("paymentKey", paymentKey);
            requestBody.put("orderId", orderId);
            requestBody.put("amount", amount.intValue());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 토스페이먼츠 API 호출
            String url = tossPaymentsConfig.getApiUrl() + "/v1/payments/confirm";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> result = response.getBody();

                // DB에 결제 정보 저장
                Long orderIdLong = Long.parseLong(orderId);
                Order order = orderRepository.findById(orderIdLong)
                        .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

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

                return result;
            } else {
                throw new RuntimeException("Payment confirmation failed");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
    }
}