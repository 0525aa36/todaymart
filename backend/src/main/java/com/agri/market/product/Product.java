package com.agri.market.product;

import com.agri.market.category.Category;
import com.agri.market.seller.Seller;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    // 기존 String 카테고리 (Deprecated - 하위 호환성을 위해 유지)
    @Column
    private String category;

    // 새로운 Category 엔티티와의 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Category categoryEntity;

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

    // 공급가 (도매가)
    @Column(precision = 10, scale = 2)
    private BigDecimal supplyPrice;

    // 상품별 배송비
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal shippingFee = new BigDecimal("3000"); // 기본 배송비 3000원

    // 합포장 가능 여부
    @Column(nullable = false)
    private Boolean canCombineShipping = false;

    // 합포장 단위 (예: 5개씩 묶음, null이면 합포장 불가)
    @Column
    private Integer combineShippingUnit;

    // 택배사 (CJ대한통운, 로젠택배, 한진택배 등)
    @Column(length = 50)
    private String courierCompany;

    // 최소 주문 수량
    @Column(nullable = false)
    private Integer minOrderQuantity = 1;

    // 최대 주문 수량 (null이면 제한 없음, 재고 수량까지만)
    @Column
    private Integer maxOrderQuantity;

    // 이벤트 상품 여부
    @Column(name = "is_event_product", nullable = false)
    private Boolean isEventProduct = false;

    // 하위 호환성과 성능을 위해 메인 이미지 URL 유지
    private String imageUrl;

    // 여러 메인 이미지 URL들 (쉼표로 구분, 임시 필드)
    @Column(length = 2000)
    private String imageUrls;

    // 상세페이지 이미지 URL들 (쉼표로 구분, 임시 필드)
    @Column(length = 2000)
    private String detailImageUrls;

    // 정규화: 옵션들을 별도 테이블로 관리
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<ProductOption> options = new ArrayList<>();

    // 판매자 정보
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 할인이 적용된 실제 판매 가격 계산 (반올림하여 정수로 반환)
    public BigDecimal getDiscountedPrice() {
        if (discountRate != null && discountRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = price.multiply(discountRate).divide(new BigDecimal("100"));
            BigDecimal discountedPrice = price.subtract(discount);
            // 반올림하여 정수로 만들기 (1원 단위 제거)
            return discountedPrice.setScale(0, RoundingMode.HALF_UP);
        }
        return price;
    }

    // 편의 메서드: 옵션 추가
    public void addOption(ProductOption option) {
        options.add(option);
        option.setProduct(this);
    }
}