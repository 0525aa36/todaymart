package com.agri.market.settlement;

public enum SettlementStatus {
    /**
     * 정산 대기 중
     */
    PENDING,

    /**
     * 정산 승인됨
     */
    APPROVED,

    /**
     * 지급 완료
     */
    PAID,

    /**
     * 정산 취소
     */
    CANCELLED
}
