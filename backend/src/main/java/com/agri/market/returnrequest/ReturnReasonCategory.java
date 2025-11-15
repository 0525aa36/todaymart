package com.agri.market.returnrequest;

/**
 * 반품 사유 카테고리
 */
public enum ReturnReasonCategory {
    CHANGE_OF_MIND("단순 변심"),
    DEFECTIVE_PRODUCT("상품 불량/하자"),
    WRONG_DELIVERY("오배송"),
    PRODUCT_INFO_MISMATCH("상품 정보 상이"),
    DELIVERY_DELAY("배송 지연"),
    OTHER("기타");

    private final String description;

    ReturnReasonCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 판매자 귀책 사유인지 확인
     * @return true if seller is responsible
     */
    public boolean isSellerFault() {
        return this == DEFECTIVE_PRODUCT ||
               this == WRONG_DELIVERY ||
               this == PRODUCT_INFO_MISMATCH ||
               this == DELIVERY_DELAY;
    }
}
