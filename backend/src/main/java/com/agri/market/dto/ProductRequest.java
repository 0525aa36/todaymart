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

    // 공급가 (도매가, 선택)
    private BigDecimal supplyPrice;

    // 상품별 배송비 (필수, 기본값 3000원)
    @NotNull(message = "배송비는 필수입니다")
    @DecimalMin(value = "0.0", inclusive = true, message = "배송비는 0 이상이어야 합니다")
    private BigDecimal shippingFee = new BigDecimal("3000");

    // 합포장 가능 여부 (필수, 기본값 false)
    @NotNull
    private Boolean canCombineShipping = false;

    // 합포장 단위 (선택, 예: 5개씩 묶음)
    private Integer combineShippingUnit;

    // 택배사 (선택)
    private String courierCompany;

    // 최소 주문 수량 (필수, 기본값 1)
    @NotNull(message = "최소 주문 수량은 필수입니다")
    @Min(value = 1, message = "최소 주문 수량은 1 이상이어야 합니다")
    private Integer minOrderQuantity = 1;

    // 최대 주문 수량 (선택, null이면 제한 없음)
    private Integer maxOrderQuantity;

    // 판매자 ID (선택 - null이면 직매)
    private Long sellerId;
}
