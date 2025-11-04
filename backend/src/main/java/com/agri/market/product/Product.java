package com.agri.market.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // 하위 호환성과 성능을 위해 메인 이미지 URL 유지
    private String imageUrl;

    // 정규화: 이미지들을 별도 테이블로 관리
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @com.fasterxml.jackson.annotation.JsonManagedReference("product-images")
    private List<ProductImage> images = new ArrayList<>();

    // 정규화: 상품 옵션들을 별도 테이블로 관리
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("product-options")
    private List<ProductOption> options = new ArrayList<>();

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

    // 편의 메서드: 이미지 추가
    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }

    // 편의 메서드: 옵션 추가
    public void addOption(ProductOption option) {
        options.add(option);
        option.setProduct(this);
    }
}