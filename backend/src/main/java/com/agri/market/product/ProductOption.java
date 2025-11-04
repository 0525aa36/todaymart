package com.agri.market.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_options")
@Getter
@Setter
public class ProductOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference("product-options")
    private Product product;

    @Column(nullable = false, length = 100)
    private String optionName; // 예: "중량", "색상", "크기"

    @Column(nullable = false, length = 100)
    private String optionValue; // 예: "1kg", "빨강", "대"

    @Column(precision = 10, scale = 2)
    private BigDecimal additionalPrice = BigDecimal.ZERO; // 추가 금액

    @Column(nullable = false)
    private Integer stock = 0; // 옵션별 재고

    @Column(nullable = false)
    private Boolean isAvailable = true; // 판매 가능 여부

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
