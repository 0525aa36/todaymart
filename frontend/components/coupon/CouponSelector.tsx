"use client";

import { useState, useEffect } from "react";
import { UserCoupon } from "@/types/coupon";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ticket, X } from "lucide-react";
import CouponList from "./CouponList";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CouponSelectorProps {
  orderAmount: number;
  onCouponSelect: (userCoupon: UserCoupon | null) => void;
  selectedCoupon?: UserCoupon | null;
}

/**
 * 주문 시 쿠폰 선택 컴포넌트
 */
export default function CouponSelector({
  orderAmount,
  onCouponSelect,
  selectedCoupon
}: CouponSelectorProps) {
  const [open, setOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableCoupons();
    }
  }, [open, orderAmount]);

  const fetchAvailableCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const coupons = await apiFetch<UserCoupon[]>(
        `/api/user/coupons/available-for-order?orderAmount=${orderAmount}`,
        { auth: true }
      );
      setAvailableCoupons(coupons);
    } catch (err: any) {
      setError(err.message || "쿠폰을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCouponClick = (coupon: UserCoupon | any) => {
    // CouponList가 UserCoupon을 전달
    onCouponSelect(coupon as UserCoupon);
    setOpen(false);
  };

  const handleRemoveCoupon = () => {
    onCouponSelect(null);
  };

  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    const coupon = selectedCoupon.coupon;
    let discount = 0;

    if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.discountValue;
    } else {
      discount = orderAmount * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }

    return Math.min(discount, orderAmount);
  };

  return (
    <div className="space-y-2">
      {selectedCoupon ? (
        <div className="flex items-center justify-between p-4 border rounded-lg" style={{ backgroundColor: "#E8F5E9" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5" style={{ color: "var(--color-success)" }} />
              <span className="font-semibold">{selectedCoupon.coupon.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {calculateDiscount().toLocaleString()}원 할인
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Ticket className="mr-2 h-4 w-4" />
              쿠폰 선택
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>사용 가능한 쿠폰</DialogTitle>
              <DialogDescription>
                현재 주문 금액: {orderAmount.toLocaleString()}원
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">쿠폰을 불러오는 중...</p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!loading && !error && (
                <CouponList
                  userCoupons={availableCoupons}
                  onCouponClick={handleCouponClick}
                  emptyMessage="사용 가능한 쿠폰이 없습니다."
                  showStatus={false}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
