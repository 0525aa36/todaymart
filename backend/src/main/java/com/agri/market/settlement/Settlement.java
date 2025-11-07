package com.agri.market.settlement;

import com.agri.market.seller.Seller;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
@Getter
@Setter
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 정산 대상 판매자
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    /**
     * 정산 기간 시작일
     */
    @Column(nullable = false)
    private LocalDate startDate;

    /**
     * 정산 기간 종료일
     */
    @Column(nullable = false)
    private LocalDate endDate;

    /**
     * 주문 건수 (정산 기간 내 해당 판매자의 주문 건수)
     */
    @Column(nullable = false)
    private Integer orderCount = 0;

    /**
     * 총 매출액 (판매자의 상품 총 매출)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSales = BigDecimal.ZERO;

    /**
     * 수수료율 (정산 당시 판매자의 수수료율, %)
     */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate = BigDecimal.ZERO;

    /**
     * 수수료 금액 (매출 * 수수료율)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    /**
     * 정산 금액 (매출 - 수수료)
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount = BigDecimal.ZERO;

    /**
     * 정산 상태: PENDING(대기), APPROVED(승인), PAID(지급완료), CANCELLED(취소)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementStatus status = SettlementStatus.PENDING;

    /**
     * 지급일
     */
    private LocalDate paymentDate;

    /**
     * 지급 방법
     */
    @Column(length = 50)
    private String paymentMethod;

    /**
     * 비고
     */
    @Column(columnDefinition = "TEXT")
    private String memo;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
