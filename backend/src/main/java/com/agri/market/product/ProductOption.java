package com.agri.market.product;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_options")
public class ProductOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Product product;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(nullable = false)
    private Boolean isRequired = false;

    // 기존 코드 호환성을 위한 필드들
    private String optionName;
    private String optionValue;
    private Boolean isAvailable = true;

    // Constructors
    public ProductOption() {}

    public ProductOption(Product product, String name, BigDecimal additionalPrice, Integer stock, Boolean isRequired) {
        this.product = product;
        this.name = name;
        this.additionalPrice = additionalPrice;
        this.stock = stock;
        this.isRequired = isRequired;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getAdditionalPrice() { return additionalPrice; }
    public void setAdditionalPrice(BigDecimal additionalPrice) { this.additionalPrice = additionalPrice; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    // 기존 코드 호환성을 위한 메서드들
    public String getOptionName() { return optionName != null ? optionName : name; }
    public void setOptionName(String optionName) { 
        this.optionName = optionName; 
        if (this.name == null) this.name = optionName;
    }

    public String getOptionValue() { return optionValue; }
    public void setOptionValue(String optionValue) { this.optionValue = optionValue; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
