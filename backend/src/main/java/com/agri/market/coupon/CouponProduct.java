package com.agri.market.coupon;

import com.agri.market.product.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 쿠폰 적용 가능 상품 엔티티
 * (쿠폰이 특정 상품에만 적용되는 경우 사용)
 */
@Entity
@Table(name = "coupon_products",
       uniqueConstraints = @UniqueConstraint(columnNames = {"coupon_id", "product_id"}))
@Getter
@Setter
public class CouponProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 쿠폰
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    /**
     * 적용 가능한 상품
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * 생성일시
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
