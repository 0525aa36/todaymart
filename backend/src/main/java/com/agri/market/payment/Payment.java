package com.agri.market.payment;

import com.agri.market.order.Order;
import com.agri.market.order.PaymentStatus;
import com.agri.market.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // 결제한 사용자

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; // PENDING, PAID, FAILED

    private String transactionId; // From payment gateway (e.g., paymentKey from Toss Payments)

    @Column(length = 50)
    private String method; // 결제 수단 (TOSS_PAYMENTS, CARD, etc.)

    private LocalDateTime approvedAt; // 결제 승인 시간

    @CreationTimestamp
    @Column(name = "payment_date", nullable = false, updatable = false)
    private LocalDateTime paymentDate;

    // Refund information
    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount; // 환불 금액
    private LocalDateTime refundedAt; // 환불 시간
    private String refundTransactionId; // 환불 거래 ID
    private String refundReason; // 환불 사유
}