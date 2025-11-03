package com.agri.market.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String origin;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountRate; // 할인율 (0.00 ~ 100.00)

    @Column(nullable = false)
    private Integer stock;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String imageUrls; // 여러 이미지 URL을 콤마로 구분하여 저장

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 할인이 적용된 실제 판매 가격 계산
    public BigDecimal getDiscountedPrice() {
        if (discountRate != null && discountRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = price.multiply(discountRate).divide(new BigDecimal("100"));
            return price.subtract(discount);
        }
        return price;
    }
}