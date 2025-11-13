package com.agri.market.admin.audit;

/**
 * 관리자 감사 로그에서 추적하는 작업 유형
 */
public enum ActionType {
    // 사용자 관련
    USER_ROLE_CHANGE("사용자 역할 변경"),
    USER_STATUS_CHANGE("사용자 상태 변경"),
    USER_DELETE("사용자 삭제"),

    // 주문 관련
    ORDER_STATUS_CHANGE("주문 상태 변경"),
    ORDER_CANCEL("주문 취소"),
    ORDER_TRACKING_UPDATE("배송 추적번호 업데이트"),

    // 결제 관련
    PAYMENT_REFUND("결제 환불"),
    PAYMENT_STATUS_CHANGE("결제 상태 변경"),

    // 상품 관련
    PRODUCT_CREATE("상품 생성"),
    PRODUCT_UPDATE("상품 수정"),
    PRODUCT_DELETE("상품 삭제"),
    PRODUCT_STATUS_CHANGE("상품 상태 변경"),

    // 판매자 관련
    SELLER_CREATE("판매자 생성"),
    SELLER_UPDATE("판매자 수정"),
    SELLER_DELETE("판매자 삭제"),
    SELLER_STATUS_CHANGE("판매자 상태 변경"),

    // 쿠폰 관련
    COUPON_CREATE("쿠폰 생성"),
    COUPON_UPDATE("쿠폰 수정"),
    COUPON_DELETE("쿠폰 삭제"),

    // 기타
    ADMIN_SETTING_CHANGE("관리자 설정 변경"),
    DATA_EXPORT("데이터 내보내기");

    private final String description;

    ActionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
