package com.agri.market.order;

public enum PaymentStatus {
    PENDING,           // 결제 대기
    PAID,              // 결제 완료
    FAILED,            // 결제 실패
    PARTIALLY_REFUNDED, // 부분 환불됨
    FULLY_REFUNDED     // 전액 환불됨
}