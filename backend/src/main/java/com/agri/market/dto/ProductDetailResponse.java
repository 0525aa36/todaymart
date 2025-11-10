package com.agri.market.dto;

import com.agri.market.product.Product;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String category;
    private String origin;
    private String description;
    private BigDecimal price;
    private BigDecimal discountRate;
    private BigDecimal discountedPrice;
    private Integer stock;
    private String imageUrl;
    private String imageUrls;
    private String detailImageUrls;
    private List<ProductOptionDto> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductDetailResponse fromEntity(Product product) {
        ProductDetailResponse dto = new ProductDetailResponse();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setOrigin(product.getOrigin());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setDiscountRate(product.getDiscountRate());
        dto.setDiscountedPrice(product.getDiscountedPrice());
        dto.setStock(product.getStock());
        dto.setImageUrl(product.getImageUrl());
        dto.setImageUrls(product.getImageUrls());
        dto.setDetailImageUrls(product.getDetailImageUrls());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        // 옵션 변환
        dto.setOptions(product.getOptions().stream()
                .map(ProductOptionDto::fromEntity)
                .collect(Collectors.toList()));

        return dto;
    }
}
