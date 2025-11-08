package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 쿠폰 유효성 검증 응답 DTO
 */
@Getter
@Setter
@AllArgsConstructor
public class CouponValidationResponse {

    private Boolean isValid; // 유효 여부
    private String message; // 에러 메시지 또는 성공 메시지
    private BigDecimal discountAmount; // 할인 금액 (유효한 경우)
    private BigDecimal finalAmount; // 최종 금액 (유효한 경우)

    public static CouponValidationResponse success(BigDecimal discountAmount, BigDecimal finalAmount) {
        return new CouponValidationResponse(
                true,
                "쿠폰이 적용되었습니다.",
                discountAmount,
                finalAmount
        );
    }

    public static CouponValidationResponse failure(String message) {
        return new CouponValidationResponse(
                false,
                message,
                null,
                null
        );
    }
}
