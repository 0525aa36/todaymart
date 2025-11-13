package com.agri.market.dto;

import com.agri.market.product.ProductNotice;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 상품 고시 정보 응답 DTO
 */
@Data
public class ProductNoticeResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String foodType;
    private String manufacturer;
    private String expirationInfo;
    private String capacity;
    private String ingredients;
    private String nutritionFacts;
    private String gmoInfo;
    private String safetyWarnings;
    private String importDeclaration;
    private String customerServicePhone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductNoticeResponse from(ProductNotice notice) {
        ProductNoticeResponse response = new ProductNoticeResponse();
        response.setId(notice.getId());
        response.setProductId(notice.getProduct().getId());
        response.setProductName(notice.getProductName());
        response.setFoodType(notice.getFoodType());
        response.setManufacturer(notice.getManufacturer());
        response.setExpirationInfo(notice.getExpirationInfo());
        response.setCapacity(notice.getCapacity());
        response.setIngredients(notice.getIngredients());
        response.setNutritionFacts(notice.getNutritionFacts());
        response.setGmoInfo(notice.getGmoInfo());
        response.setSafetyWarnings(notice.getSafetyWarnings());
        response.setImportDeclaration(notice.getImportDeclaration());
        response.setCustomerServicePhone(notice.getCustomerServicePhone());
        response.setCreatedAt(notice.getCreatedAt());
        response.setUpdatedAt(notice.getUpdatedAt());
        return response;
    }
}
