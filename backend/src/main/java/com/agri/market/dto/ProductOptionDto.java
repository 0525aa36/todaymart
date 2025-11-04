package com.agri.market.dto;

import com.agri.market.product.ProductOption;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductOptionDto {
    private Long id;
    private String optionName;
    private String optionValue;
    private BigDecimal additionalPrice;
    private Integer stock;
    private Boolean isAvailable;

    public static ProductOptionDto fromEntity(ProductOption option) {
        ProductOptionDto dto = new ProductOptionDto();
        dto.setId(option.getId());
        dto.setOptionName(option.getOptionName());
        dto.setOptionValue(option.getOptionValue());
        dto.setAdditionalPrice(option.getAdditionalPrice());
        dto.setStock(option.getStock());
        dto.setIsAvailable(option.getIsAvailable());
        return dto;
    }
}
