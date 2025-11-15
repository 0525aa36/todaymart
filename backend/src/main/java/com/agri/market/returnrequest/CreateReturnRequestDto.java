package com.agri.market.returnrequest;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * 반품 요청 생성 DTO
 */
@Getter
@Setter
public class CreateReturnRequestDto {

    /**
     * 주문 ID
     */
    @NotNull(message = "주문 ID는 필수입니다.")
    private Long orderId;

    /**
     * 반품 사유 카테고리
     */
    @NotNull(message = "반품 사유는 필수입니다.")
    private ReturnReasonCategory reasonCategory;

    /**
     * 상세 사유
     */
    @NotNull(message = "상세 사유는 필수입니다.")
    @Size(min = 10, max = 1000, message = "상세 사유는 10자 이상 1000자 이하여야 합니다.")
    private String detailedReason;

    /**
     * 증빙 이미지 URL 목록
     */
    private List<String> proofImageUrls;

    /**
     * 반품할 아이템 목록
     * Key: OrderItem ID
     * Value: 반품 수량
     */
    @NotEmpty(message = "반품할 상품을 선택해주세요.")
    private Map<Long, Integer> returnItems;
}
