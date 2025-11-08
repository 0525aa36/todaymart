package com.agri.market.dto;

import com.agri.market.coupon.Coupon;
import com.agri.market.coupon.CouponUsageType;
import com.agri.market.coupon.DiscountType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 쿠폰 응답 DTO
 */
@Getter
@Setter
public class CouponResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer totalQuantity;
    private Integer usedQuantity;
    private Integer remainingQuantity; // 남은 수량 (계산값)
    private Boolean isActive;
    private CouponUsageType usageType;
    private String applicableCategory;
    private Boolean isValid; // 현재 유효한지 (계산값)
    private Boolean isExpired; // 만료되었는지 (계산값)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CouponResponse(Coupon coupon) {
        this.id = coupon.getId();
        this.code = coupon.getCode();
        this.name = coupon.getName();
        this.description = coupon.getDescription();
        this.discountType = coupon.getDiscountType();
        this.discountValue = coupon.getDiscountValue();
        this.minOrderAmount = coupon.getMinOrderAmount();
        this.maxDiscountAmount = coupon.getMaxDiscountAmount();
        this.startDate = coupon.getStartDate();
        this.endDate = coupon.getEndDate();
        this.totalQuantity = coupon.getTotalQuantity();
        this.usedQuantity = coupon.getUsedQuantity();
        this.remainingQuantity = coupon.getTotalQuantity() != null
                ? coupon.getTotalQuantity() - coupon.getUsedQuantity()
                : null; // 무제한
        this.isActive = coupon.getIsActive();
        this.usageType = coupon.getUsageType();
        this.applicableCategory = coupon.getApplicableCategory();
        this.isValid = coupon.isValid();
        this.isExpired = coupon.isExpired();
        this.createdAt = coupon.getCreatedAt();
        this.updatedAt = coupon.getUpdatedAt();
    }
}
