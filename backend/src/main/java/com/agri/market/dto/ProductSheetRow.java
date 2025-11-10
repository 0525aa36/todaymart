package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 구글 시트의 상품 데이터 행을 표현하는 DTO
 * 시트에서 읽어온 데이터를 파싱하고 검증하는 용도로 사용
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductSheetRow {
    // 시트의 각 컬럼에 대응하는 필드들

    private Long id; // 상품ID (읽기전용)
    private String name; // 상품명
    private String category; // 카테고리
    private String origin; // 원산지
    private BigDecimal price; // 판매가
    private BigDecimal discountRate; // 할인율(%)
    private BigDecimal discountedPrice; // 할인가 (읽기전용, 계산됨)
    private BigDecimal supplyPrice; // 공급가
    private Integer stock; // 재고수량
    private Integer minOrderQuantity; // 최소주문수량
    private Integer maxOrderQuantity; // 최대주문수량
    private BigDecimal shippingFee; // 배송비
    private Boolean canCombineShipping; // 합포장가능 (Y/N)
    private Integer combineShippingUnit; // 합포장단위
    private String courierCompany; // 택배사
    private String imageUrl; // 메인이미지URL
    private String description; // 상품설명
    private Integer optionCount; // 옵션개수 (읽기전용)
    private Integer imageCount; // 이미지개수 (읽기전용)
    private LocalDateTime createdAt; // 등록일시 (읽기전용)
    private LocalDateTime updatedAt; // 수정일시 (읽기전용)
    private String syncStatus; // 동기화상태

    // 행 번호 (에러 메시지 표시용)
    private int rowNumber;

    // 검증 에러 메시지
    private String errorMessage;

    /**
     * 필수 필드 검증
     */
    public boolean isValid() {
        if (name == null || name.trim().isEmpty()) {
            errorMessage = "상품명은 필수입니다.";
            return false;
        }
        if (category == null || category.trim().isEmpty()) {
            errorMessage = "카테고리는 필수입니다.";
            return false;
        }
        if (origin == null || origin.trim().isEmpty()) {
            errorMessage = "원산지는 필수입니다.";
            return false;
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            errorMessage = "판매가는 0보다 커야 합니다.";
            return false;
        }
        if (stock == null || stock < 0) {
            errorMessage = "재고수량은 0 이상이어야 합니다.";
            return false;
        }
        if (minOrderQuantity == null || minOrderQuantity < 1) {
            errorMessage = "최소주문수량은 1 이상이어야 합니다.";
            return false;
        }
        if (shippingFee == null || shippingFee.compareTo(BigDecimal.ZERO) < 0) {
            errorMessage = "배송비는 0 이상이어야 합니다.";
            return false;
        }
        if (discountRate != null && (discountRate.compareTo(BigDecimal.ZERO) < 0 || discountRate.compareTo(new BigDecimal("100")) > 0)) {
            errorMessage = "할인율은 0~100 사이여야 합니다.";
            return false;
        }

        return true;
    }
}
