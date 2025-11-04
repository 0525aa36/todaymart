package com.agri.market.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductOptionRequest {
    private String optionName;
    private String optionValue;
    private BigDecimal additionalPrice;
    private Integer stock;
    private Boolean isAvailable;
}
