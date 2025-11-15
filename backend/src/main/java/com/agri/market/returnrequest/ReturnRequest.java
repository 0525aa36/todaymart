package com.agri.market.returnrequest;

import com.agri.market.order.Order;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 반품 요청 엔티티
 */
@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 주문 정보
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /**
     * 반품 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus status = ReturnStatus.REQUESTED;

    /**
     * 반품 사유 카테고리
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnReasonCategory reasonCategory;

    /**
     * 상세 사유
     */
    @Column(columnDefinition = "TEXT")
    private String detailedReason;

    /**
     * 관리자 메모
     */
    @Column(columnDefinition = "TEXT")
    private String adminNote;

    /**
     * 환불 금액 정보
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal totalRefundAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal itemsRefundAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal shippingRefundAmount;

    /**
     * 증빙 이미지 URLs (콤마로 구분)
     */
    @Column(columnDefinition = "TEXT")
    private String proofImageUrls;

    /**
     * 타임스탬프
     */
    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime rejectedAt;

    private LocalDateTime completedAt;

    private LocalDateTime refundedAt;

    /**
     * 반품 아이템 목록
     */
    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ReturnItem> returnItems = new ArrayList<>();

    /**
     * 생성 시 자동으로 requestedAt 설정
     */
    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    /**
     * 반품 아이템 추가 헬퍼 메서드
     */
    public void addReturnItem(ReturnItem item) {
        returnItems.add(item);
        item.setReturnRequest(this);
    }

    /**
     * 반품 승인
     */
    public void approve(String note) {
        this.status = ReturnStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
        this.adminNote = note;
    }

    /**
     * 반품 거부
     */
    public void reject(String reason) {
        this.status = ReturnStatus.REJECTED;
        this.rejectedAt = LocalDateTime.now();
        this.adminNote = reason;
    }

    /**
     * 반품 완료
     */
    public void complete() {
        this.status = ReturnStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.refundedAt = LocalDateTime.now();
    }

    /**
     * 판매자 귀책 여부
     */
    public boolean isSellerFault() {
        return reasonCategory != null && reasonCategory.isSellerFault();
    }
}
