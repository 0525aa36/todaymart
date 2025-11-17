package com.agri.market.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class SpecialDealRequest {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal discountRate;
    private Boolean isActive;
    private Integer displayOrder;
    private String bannerImageUrl;
    private String backgroundColor;
    private String textColor;
    private List<Long> productIds; // 특가에 포함할 상품 ID 목록
}
