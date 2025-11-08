"use client";

import { UserCoupon, Coupon } from "@/types/coupon";
import CouponCard from "./CouponCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift } from "lucide-react";

interface CouponListProps {
  userCoupons?: UserCoupon[];
  coupons?: Coupon[];
  onCouponClick?: (coupon: UserCoupon | Coupon) => void;
  selectedCouponId?: number;
  showStatus?: boolean;
  emptyMessage?: string;
}

/**
 * 쿠폰 목록 컴포넌트
 */
export default function CouponList({
  userCoupons,
  coupons,
  onCouponClick,
  selectedCouponId,
  showStatus = true,
  emptyMessage = "사용 가능한 쿠폰이 없습니다."
}: CouponListProps) {
  const hasUserCoupons = userCoupons && userCoupons.length > 0;
  const hasCoupons = coupons && coupons.length > 0;

  if (!hasUserCoupons && !hasCoupons) {
    return (
      <Alert>
        <Gift className="h-4 w-4" />
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {userCoupons?.map((userCoupon) => (
        <CouponCard
          key={userCoupon.id}
          userCoupon={userCoupon}
          onClick={() => onCouponClick?.(userCoupon)}
          selected={selectedCouponId === userCoupon.id}
          showStatus={showStatus}
        />
      ))}

      {coupons?.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          onClick={() => onCouponClick?.(coupon)}
          selected={selectedCouponId === coupon.id}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
