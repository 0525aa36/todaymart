package com.agri.market.dto;

import com.agri.market.product.Product;
import com.agri.market.wishlist.WishlistItem;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {
    private Long id;
    private ProductInfo product;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductInfo {
        private Long id;
        private String name;
        private String category;
        private String origin;
        private BigDecimal price;
        private BigDecimal discountRate;
        private BigDecimal discountedPrice;
        private Integer stock;
        private String imageUrl;
        private Double averageRating;
        private Long reviewCount;
        private List<Object> options;  // 옵션 리스트 추가
    }

    public WishlistItemDto(WishlistItem item, Double avgRating, Long reviewCount) {
        this.id = item.getId();
        this.createdAt = item.getCreatedAt();

        Product p = item.getProduct();
        ProductInfo productInfo = new ProductInfo();
        productInfo.setId(p.getId());
        productInfo.setName(p.getName());
        productInfo.setCategory(p.getCategory());
        productInfo.setOrigin(p.getOrigin());
        productInfo.setPrice(p.getPrice());
        productInfo.setDiscountRate(p.getDiscountRate());
        productInfo.setDiscountedPrice(p.getDiscountedPrice());
        productInfo.setStock(p.getStock());
        productInfo.setImageUrl(p.getImageUrl());

        productInfo.setAverageRating(avgRating != null ?
            BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0);
        productInfo.setReviewCount(reviewCount != null ? reviewCount : 0L);
        productInfo.setOptions(p.getOptions() != null ? List.copyOf(p.getOptions()) : List.of());

        this.product = productInfo;
    }
}
