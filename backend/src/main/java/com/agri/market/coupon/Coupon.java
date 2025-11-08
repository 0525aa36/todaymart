package com.agri.market.coupon;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 쿠폰 엔티티
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 쿠폰 코드 (고유값, 예: "WELCOME10", "SUMMER20")
     */
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    /**
     * 쿠폰 이름
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 쿠폰 설명
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 할인 타입 (정액/정률)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DiscountType discountType;

    /**
     * 할인값 (정액: 원, 정률: %)
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    /**
     * 최소 주문 금액
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    /**
     * 최대 할인 금액 (정률 할인용, null이면 제한 없음)
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    /**
     * 쿠폰 시작일
     */
    @Column(nullable = false)
    private LocalDateTime startDate;

    /**
     * 쿠폰 종료일
     */
    @Column(nullable = false)
    private LocalDateTime endDate;

    /**
     * 총 발급 수량 (null이면 무제한)
     */
    @Column
    private Integer totalQuantity;

    /**
     * 사용된 수량
     */
    @Column(nullable = false)
    private Integer usedQuantity = 0;

    /**
     * 활성화 여부
     */
    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * 사용 타입 (1회용/재사용 가능)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponUsageType usageType = CouponUsageType.SINGLE_USE;

    /**
     * 적용 가능한 카테고리 (null이면 전체 카테고리)
     */
    @Column(length = 100)
    private String applicableCategory;

    /**
     * 생성일시
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정일시
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 쿠폰 적용 가능 상품 목록 (null이면 전체 상품)
     */
    @OneToMany(mappedBy = "coupon", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CouponProduct> couponProducts = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 쿠폰이 현재 유효한지 확인
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive
                && now.isAfter(startDate)
                && now.isBefore(endDate)
                && (totalQuantity == null || usedQuantity < totalQuantity);
    }

    /**
     * 쿠폰이 만료되었는지 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endDate);
    }

    /**
     * 쿠폰 재고가 충분한지 확인
     */
    public boolean hasStock() {
        return totalQuantity == null || usedQuantity < totalQuantity;
    }

    /**
     * 주문 금액이 최소 주문 금액을 만족하는지 확인
     */
    public boolean meetsMinOrderAmount(BigDecimal orderAmount) {
        return orderAmount.compareTo(minOrderAmount) >= 0;
    }

    /**
     * 할인 금액 계산
     */
    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        BigDecimal discount;

        if (discountType == DiscountType.FIXED_AMOUNT) {
            // 정액 할인
            discount = discountValue;
        } else {
            // 정률 할인
            discount = orderAmount.multiply(discountValue).divide(BigDecimal.valueOf(100));

            // 최대 할인 금액 제한
            if (maxDiscountAmount != null && discount.compareTo(maxDiscountAmount) > 0) {
                discount = maxDiscountAmount;
            }
        }

        // 할인 금액이 주문 금액보다 클 수 없음
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        return discount;
    }

    /**
     * 특정 카테고리에 적용 가능한지 확인
     */
    public boolean isApplicableToCategory(String category) {
        return applicableCategory == null || applicableCategory.equals(category);
    }

    /**
     * 특정 상품에 적용 가능한지 확인
     */
    public boolean isApplicableToProduct(Long productId) {
        // couponProducts가 비어있으면 모든 상품에 적용 가능
        if (couponProducts.isEmpty()) {
            return true;
        }
        // 지정된 상품 목록에 포함되어 있는지 확인
        return couponProducts.stream()
                .anyMatch(cp -> cp.getProduct().getId().equals(productId));
    }
}
