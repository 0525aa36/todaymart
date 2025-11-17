package com.agri.market.specialdeal;

import com.agri.market.product.Product;
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
@Table(name = "special_deals")
@Getter
@Setter
public class SpecialDeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title; // 특가 이벤트 제목

    @Column(columnDefinition = "TEXT")
    private String description; // 설명

    @Column(nullable = false)
    private LocalDateTime startTime; // 시작 시간

    @Column(nullable = false)
    private LocalDateTime endTime; // 종료 시간

    @Column(precision = 5, scale = 2)
    private BigDecimal discountRate; // 할인율 (0.00 ~ 100.00)

    @Column(nullable = false)
    private Boolean isActive = true; // 활성화 여부

    @Column(nullable = false)
    private Integer displayOrder = 0; // 표시 순서

    @Column(length = 1000)
    private String bannerImageUrl; // 배너 이미지 URL

    @Column(length = 50)
    private String backgroundColor; // 배경색

    @Column(length = 50)
    private String textColor; // 텍스트 색

    // 특가 상품 목록 (ManyToMany)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "special_deal_products",
        joinColumns = @JoinColumn(name = "special_deal_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 편의 메서드: 특가 진행 중인지 확인
    public boolean isOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return isActive &&
               now.isAfter(startTime) &&
               now.isBefore(endTime);
    }

    // 편의 메서드: 특가 시작 전인지 확인
    public boolean isUpcoming() {
        return isActive && LocalDateTime.now().isBefore(startTime);
    }

    // 편의 메서드: 특가 종료되었는지 확인
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endTime);
    }

    // 편의 메서드: 상품 추가
    public void addProduct(Product product) {
        this.products.add(product);
    }

    // 편의 메서드: 상품 제거
    public void removeProduct(Product product) {
        this.products.remove(product);
    }
}
