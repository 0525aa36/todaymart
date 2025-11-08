"use client";

import { UserCoupon, Coupon } from "@/types/coupon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Tag, AlertCircle } from "lucide-react";

interface CouponCardProps {
  userCoupon?: UserCoupon;
  coupon?: Coupon;
  onClick?: () => void;
  selected?: boolean;
  showStatus?: boolean;
}

/**
 * 쿠폰 카드 컴포넌트
 * UserCoupon 또는 Coupon 객체를 받아서 표시
 */
export default function CouponCard({
  userCoupon,
  coupon: couponProp,
  onClick,
  selected = false,
  showStatus = true
}: CouponCardProps) {
  const coupon = userCoupon?.coupon || couponProp;

  if (!coupon) {
    return null;
  }

  const isDisabled = userCoupon ? !userCoupon.isAvailable : !coupon.isValid;
  const isExpired = userCoupon ? userCoupon.isExpired : coupon.isExpired;
  const isUsed = userCoupon?.isUsed || false;

  const formatDiscount = () => {
    if (coupon.discountType === 'FIXED_AMOUNT') {
      return `${coupon.discountValue.toLocaleString()}원`;
    } else {
      return `${coupon.discountValue}%`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!showStatus) return null;

    if (isUsed) {
      return <Badge variant="secondary">사용완료</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">만료</Badge>;
    }
    if (userCoupon?.isAvailable) {
      return <Badge variant="default" className="bg-green-600">사용가능</Badge>;
    }
    if (coupon.isValid) {
      return <Badge variant="default" className="bg-blue-600">유효</Badge>;
    }
    return null;
  };

  return (
    <Card
      className={`
        transition-all cursor-pointer
        ${selected ? 'ring-2 ring-primary' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
      `}
      onClick={isDisabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {coupon.name}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-sm">
              {coupon.code}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* 할인 금액 */}
          <div className="text-3xl font-bold text-primary">
            {formatDiscount()}
            <span className="text-sm font-normal text-muted-foreground ml-2">할인</span>
          </div>

          {/* 설명 */}
          {coupon.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {coupon.description}
            </p>
          )}

          {/* 최소 주문 금액 */}
          {coupon.minOrderAmount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>최소 주문 금액: {coupon.minOrderAmount.toLocaleString()}원</span>
            </div>
          )}

          {/* 최대 할인 금액 (정률 할인만) */}
          {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && (
            <div className="text-sm text-muted-foreground">
              최대 할인: {coupon.maxDiscountAmount.toLocaleString()}원
            </div>
          )}

          {/* 유효기간 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(coupon.startDate)} ~ {formatDate(coupon.endDate)}
            </span>
          </div>

          {/* UserCoupon 만료일 (발급된 쿠폰의 경우) */}
          {userCoupon && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              만료일: {formatDate(userCoupon.expiresAt)}
            </div>
          )}

          {/* 잔여 수량 */}
          {coupon.totalQuantity && coupon.remainingQuantity !== undefined && (
            <div className="text-xs text-muted-foreground">
              잔여: {coupon.remainingQuantity} / {coupon.totalQuantity}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
