package com.agri.market.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 쿠폰 유효성 검증 요청 DTO
 */
@Getter
@Setter
public class CouponValidationRequest {

    @NotBlank(message = "쿠폰 코드는 필수입니다")
    private String couponCode;

    @NotNull(message = "주문 금액은 필수입니다")
    @DecimalMin(value = "0.0", message = "주문 금액은 0 이상이어야 합니다")
    private BigDecimal orderAmount;

    private String category; // 카테고리 필터용 (선택사항)

    private Long productId; // 상품 필터용 (선택사항)
}
