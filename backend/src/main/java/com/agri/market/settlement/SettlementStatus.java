package com.agri.market.settlement;

/**
 * 정산 상태
 */
public enum SettlementStatus {
    PENDING,    // 정산 대기
    COMPLETED,  // 정산 완료
    CANCELLED   // 정산 취소
}
