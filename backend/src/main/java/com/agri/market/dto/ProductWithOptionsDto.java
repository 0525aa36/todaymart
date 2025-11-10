package com.agri.market.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductWithOptionsDto {
    private Long id;
    private String name;
    private String category;
    private String origin;
    private String description;
    private BigDecimal price;
    private BigDecimal discountRate;
    private Integer stock;
    private String imageUrl;
    private String imageUrls;
    private String detailImageUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BigDecimal discountedPrice;
    private List<ProductOptionResponse> options;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getDiscountRate() { return discountRate; }
    public void setDiscountRate(BigDecimal discountRate) { this.discountRate = discountRate; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getImageUrls() { return imageUrls; }
    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }

    public String getDetailImageUrls() { return detailImageUrls; }
    public void setDetailImageUrls(String detailImageUrls) { this.detailImageUrls = detailImageUrls; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public BigDecimal getDiscountedPrice() { return discountedPrice; }
    public void setDiscountedPrice(BigDecimal discountedPrice) { this.discountedPrice = discountedPrice; }

    public List<ProductOptionResponse> getOptions() { return options; }
    public void setOptions(List<ProductOptionResponse> options) { this.options = options; }
}
