package com.agri.market.faq;

public enum FaqCategory {
    ORDER_DELIVERY("주문/배송"),
    PAYMENT("결제"),
    CANCEL_REFUND("취소/환불"),
    MEMBER("회원"),
    ETC("기타");

    private final String displayName;

    FaqCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
