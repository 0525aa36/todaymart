package com.agri.market.dto;

import com.agri.market.product.ProductImage;
import lombok.Data;

@Data
public class ProductImageDto {
    private Long id;
    private String imageUrl;
    private String imageType;
    private Integer displayOrder;

    public static ProductImageDto fromEntity(ProductImage image) {
        ProductImageDto dto = new ProductImageDto();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());
        dto.setImageType(image.getImageType().name());
        dto.setDisplayOrder(image.getDisplayOrder());
        return dto;
    }
}
