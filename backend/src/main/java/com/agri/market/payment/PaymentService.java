package com.agri.market.payment;

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
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final UserRepository userRepository;

    @Value("${payment.webhook.secret:default-secret-key}")
    private String webhookSecret;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository,
                         OrderService orderService, UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
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
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setOrderStatus(OrderStatus.PAID);
            payment.setStatus(PaymentStatus.PAID);
        } else if ("FAILED".equalsIgnoreCase(webhookRequest.getStatus())) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
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
        order.setPaymentStatus(PaymentStatus.FAILED);

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
}