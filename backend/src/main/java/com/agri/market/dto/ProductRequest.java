package com.agri.market.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 상품 등록/수정 요청 DTO
 */
@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "상품명은 필수입니다")
    private String name;

    @NotBlank(message = "카테고리는 필수입니다")
    private String category;

    @NotBlank(message = "원산지는 필수입니다")
    private String origin;

    private String description;

    @NotNull(message = "가격은 필수입니다")
    @DecimalMin(value = "0.0", inclusive = false, message = "가격은 0보다 커야 합니다")
    private BigDecimal price;

    private BigDecimal discountRate; // 할인율 (선택)

    @NotNull(message = "재고는 필수입니다")
    @Min(value = 0, message = "재고는 0 이상이어야 합니다")
    private Integer stock;

    private String imageUrl;

    // 판매자 ID (선택 - null이면 직매)
    private Long sellerId;
}
