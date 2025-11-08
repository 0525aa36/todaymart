package com.agri.market.dto;

import com.agri.market.coupon.UserCoupon;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 사용자 쿠폰 응답 DTO
 */
@Getter
@Setter
public class UserCouponResponse {

    private Long id;
    private CouponResponse coupon; // 쿠폰 정보
    private LocalDateTime issuedAt; // 발급일
    private LocalDateTime usedAt; // 사용일 (null이면 미사용)
    private Long orderId; // 사용된 주문 ID
    private LocalDateTime expiresAt; // 만료일
    private Boolean isUsed; // 사용 여부 (계산값)
    private Boolean isExpired; // 만료 여부 (계산값)
    private Boolean isAvailable; // 사용 가능 여부 (계산값)

    public UserCouponResponse(UserCoupon userCoupon) {
        this.id = userCoupon.getId();
        this.coupon = new CouponResponse(userCoupon.getCoupon());
        this.issuedAt = userCoupon.getIssuedAt();
        this.usedAt = userCoupon.getUsedAt();
        this.orderId = userCoupon.getOrder() != null ? userCoupon.getOrder().getId() : null;
        this.expiresAt = userCoupon.getExpiresAt();
        this.isUsed = userCoupon.isUsed();
        this.isExpired = userCoupon.isExpired();
        this.isAvailable = userCoupon.isAvailable();
    }
}
