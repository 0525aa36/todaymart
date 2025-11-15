package com.agri.market.returnrequest;

/**
 * 반품 상태
 */
public enum ReturnStatus {
    REQUESTED,      // 반품 요청
    APPROVED,       // 반품 승인
    REJECTED,       // 반품 거부
    COMPLETED       // 반품 완료 (환불 완료)
}
