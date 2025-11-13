package com.agri.market.dto;

import lombok.Data;

/**
 * 상품 고시 정보 등록/수정 요청 DTO
 */
@Data
public class ProductNoticeRequest {
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
}
