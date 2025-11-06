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

/**
 * 정산 엔티티
 */
@Entity
@Table(name = "settlements")
@Getter
@Setter
public class Settlement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 판매자
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    // 정산 기간
    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // 정산 금액
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSalesAmount = BigDecimal.ZERO; // 총 매출액

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount = BigDecimal.ZERO; // 수수료

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal settlementAmount = BigDecimal.ZERO; // 정산 금액 (매출 - 수수료)

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate; // 적용된 수수료율

    // 정산 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementStatus status = SettlementStatus.PENDING;

    // 정산 건수
    @Column(nullable = false)
    private Integer orderCount = 0; // 주문 건수

    // 정산 완료 정보
    @Column
    private LocalDateTime settledAt; // 정산 완료 일시

    @Column(length = 100)
    private String settledBy; // 정산 처리자

    @Column(columnDefinition = "TEXT")
    private String memo; // 메모

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
