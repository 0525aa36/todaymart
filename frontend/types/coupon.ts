/**
 * 쿠폰 관련 타입 정의
 */

export type DiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type CouponUsageType = 'SINGLE_USE' | 'MULTI_USE';

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  totalQuantity?: number;
  usedQuantity: number;
  remainingQuantity?: number;
  isActive: boolean;
  isValid: boolean;
  isExpired: boolean;
  usageType: CouponUsageType;
  applicableCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCoupon {
  id: number;
  coupon: Coupon;
  issuedAt: string;
  usedAt?: string;
  expiresAt: string;
  isUsed: boolean;
  isExpired: boolean;
  isAvailable: boolean;
}

export interface CouponValidationRequest {
  couponCode: string;
  orderAmount: number;
  category?: string;
  productId?: number;
}

export interface CouponValidationResponse {
  isValid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
}

export interface CouponRequest {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  totalQuantity?: number;
  isActive: boolean;
  usageType: CouponUsageType;
  applicableCategory?: string;
  applicableProductIds?: number[];
}
