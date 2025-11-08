package com.agri.market.dto;

import com.agri.market.coupon.CouponUsageType;
import com.agri.market.coupon.DiscountType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 쿠폰 생성/수정 요청 DTO
 */
@Getter
@Setter
public class CouponRequest {

    @NotBlank(message = "쿠폰 코드는 필수입니다")
    @Size(max = 50, message = "쿠폰 코드는 50자 이하여야 합니다")
    private String code;

    @NotBlank(message = "쿠폰 이름은 필수입니다")
    @Size(max = 100, message = "쿠폰 이름은 100자 이하여야 합니다")
    private String name;

    private String description;

    @NotNull(message = "할인 타입은 필수입니다")
    private DiscountType discountType;

    @NotNull(message = "할인값은 필수입니다")
    @DecimalMin(value = "0.0", message = "할인값은 0 이상이어야 합니다")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", message = "최소 주문 금액은 0 이상이어야 합니다")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    private BigDecimal maxDiscountAmount;

    @NotNull(message = "시작일은 필수입니다")
    private LocalDateTime startDate;

    @NotNull(message = "종료일은 필수입니다")
    private LocalDateTime endDate;

    @Min(value = 1, message = "총 발급 수량은 1 이상이어야 합니다")
    private Integer totalQuantity; // null이면 무제한

    private Boolean isActive = true;

    @NotNull(message = "사용 타입은 필수입니다")
    private CouponUsageType usageType = CouponUsageType.SINGLE_USE;

    private String applicableCategory; // null이면 전체 카테고리

    private List<Long> applicableProductIds; // null이면 전체 상품
}
