package com.agri.market.inquiry;

public enum InquiryStatus {
    PENDING("답변대기"),
    ANSWERED("답변완료");

    private final String displayName;

    InquiryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
