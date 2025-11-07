package com.agri.market.dto;

import com.agri.market.product.Product;
import com.agri.market.seller.Seller;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Getter
@Setter
public class ProductListDto {
    private Long id;
    private String name;
    private String category;
    private String origin;
    private BigDecimal price;
    private BigDecimal discountRate;
    private BigDecimal discountedPrice;
    private Integer stock;
    private String imageUrl;
    private LocalDateTime createdAt;

    // 판매자 정보
    private Seller seller;

    // 리뷰 통계
    private Double averageRating;
    private Long reviewCount;

    // 옵션 개수
    private Integer optionCount;

    public ProductListDto(Product product, Double averageRating, Long reviewCount) {
        this.id = product.getId();
        this.name = product.getName();
        this.category = product.getCategory();
        this.origin = product.getOrigin();
        this.price = product.getPrice();
        this.discountRate = product.getDiscountRate();
        this.discountedPrice = product.getDiscountedPrice();
        this.stock = product.getStock();
        this.imageUrl = product.getImageUrl();
        this.createdAt = product.getCreatedAt();

        // 판매자 정보
        this.seller = product.getSeller();

        // 리뷰 통계 (null 처리)
        this.averageRating = averageRating != null ?
            BigDecimal.valueOf(averageRating).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0;
        this.reviewCount = reviewCount != null ? reviewCount : 0L;

        // 옵션 개수
        this.optionCount = product.getOptions() != null ? product.getOptions().size() : 0;
    }
}
