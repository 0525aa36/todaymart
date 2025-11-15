package com.agri.market.notification;

public enum NotificationType {
    ORDER_STATUS_CHANGED,
    DELIVERY_STARTED,
    STOCK_LOW,
    NEW_ORDER,
    NEW_REVIEW,
    RETURN_REQUESTED,     // 반품 요청 (관리자에게)
    RETURN_APPROVED,      // 반품 승인 (사용자에게)
    RETURN_REJECTED,      // 반품 거부 (사용자에게)
    RETURN_COMPLETED,     // 반품 완료 (사용자에게)
    SYSTEM
}
