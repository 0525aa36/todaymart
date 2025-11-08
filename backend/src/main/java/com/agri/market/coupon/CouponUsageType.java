package com.agri.market.coupon;

/**
 * 쿠폰 사용 타입
 */
public enum CouponUsageType {
    /**
     * 1회용 (한 번 사용하면 소진)
     */
    SINGLE_USE,

    /**
     * 재사용 가능 (여러 번 사용 가능)
     */
    MULTI_USE
}
