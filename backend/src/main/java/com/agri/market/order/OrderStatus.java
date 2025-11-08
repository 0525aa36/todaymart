package com.agri.market.order;

public enum OrderStatus {
    PENDING_PAYMENT,  // 결제 대기
    PAYMENT_FAILED,   // 결제 실패
    PAID,             // 결제 완료 (상품 준비 전)
    PREPARING,        // 상품 준비중
    SHIPPED,          // 배송중
    DELIVERED,        // 배송 완료
    CANCELLED         // 주문 취소
}