package com.agri.market.dto;

import com.agri.market.product.ProductOption;
import java.math.BigDecimal;

public class ProductOptionResponse {
    private Long id;
    private String name;
    private String optionName;
    private String optionValue;
    private BigDecimal additionalPrice;
    private Integer stock;
    private Boolean isRequired;

    public ProductOptionResponse() {}

    public ProductOptionResponse(ProductOption option) {
        this.id = option.getId();
        this.name = option.getName();
        this.optionName = option.getOptionName();
        this.optionValue = option.getOptionValue();
        this.additionalPrice = option.getAdditionalPrice();
        this.stock = option.getStock();
        this.isRequired = option.getIsRequired();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOptionName() { return optionName; }
    public void setOptionName(String optionName) { this.optionName = optionName; }

    public String getOptionValue() { return optionValue; }
    public void setOptionValue(String optionValue) { this.optionValue = optionValue; }

    public BigDecimal getAdditionalPrice() { return additionalPrice; }
    public void setAdditionalPrice(BigDecimal additionalPrice) { this.additionalPrice = additionalPrice; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }
}
