package com.agri.market.returnrequest;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 반품 가능 여부 응답 DTO
 */
@Getter
@Setter
public class ReturnEligibilityResponse {

    /**
     * 주문 ID
     */
    private Long orderId;

    /**
     * 반품 가능 여부
     */
    private boolean eligible;

    /**
     * 불가능한 경우 사유
     */
    private String reason;

    /**
     * 배송 완료 시간
     */
    private LocalDateTime deliveredAt;

    /**
     * 반품 가능 마감 시간
     */
    private LocalDateTime returnDeadline;
}
