"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface CouponCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CouponCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CouponCreateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discountType: "FIXED_AMOUNT",
    discountValue: "",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    totalQuantity: "",
    usageType: "SINGLE_USE",
    applicableCategory: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast({
          title: "오류",
          description: "종료일은 시작일보다 이후여야 합니다.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Build request body
      const requestBody: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        usageType: formData.usageType,
        isActive: true,
      };

      // Optional fields
      if (formData.maxDiscountAmount) {
        requestBody.maxDiscountAmount = parseFloat(formData.maxDiscountAmount);
      }
      if (formData.totalQuantity) {
        requestBody.totalQuantity = parseInt(formData.totalQuantity);
      }
      if (formData.applicableCategory) {
        requestBody.applicableCategory = formData.applicableCategory.trim();
      }

      await apiFetch("/api/admin/coupons", {
        method: "POST",
        auth: true,
        body: JSON.stringify(requestBody),
      });

      toast({
        title: "성공",
        description: "쿠폰이 생성되었습니다.",
      });

      // Reset form
      setFormData({
        code: "",
        name: "",
        discountType: "FIXED_AMOUNT",
        discountValue: "",
        minOrderAmount: "0",
        maxDiscountAmount: "",
        startDate: "",
        endDate: "",
        totalQuantity: "",
        usageType: "SINGLE_USE",
        applicableCategory: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "오류",
        description: err.message || "쿠폰 생성에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 쿠폰 생성</DialogTitle>
          <DialogDescription>
            새로운 할인 쿠폰을 생성합니다. 필수 항목을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 쿠폰 코드 */}
            <div className="grid gap-2">
              <Label htmlFor="code">
                쿠폰 코드 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="WELCOME2025"
                required
              />
              <p className="text-xs text-muted-foreground">
                영문 대문자와 숫자만 사용하세요
              </p>
            </div>

            {/* 쿠폰 이름 */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                쿠폰 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="신규 가입 환영 쿠폰"
                required
              />
            </div>

            {/* 할인 타입 */}
            <div className="grid gap-2">
              <Label htmlFor="discountType">
                할인 타입 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_AMOUNT">정액 할인</SelectItem>
                  <SelectItem value="PERCENTAGE">퍼센트 할인</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 할인 금액/비율 */}
            <div className="grid gap-2">
              <Label htmlFor="discountValue">
                할인 금액/비율 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                placeholder={
                  formData.discountType === "FIXED_AMOUNT" ? "10000" : "10"
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.discountType === "FIXED_AMOUNT"
                  ? "할인 금액(원)"
                  : "할인 비율(%)"}
              </p>
            </div>

            {/* 최소 주문 금액 */}
            <div className="grid gap-2">
              <Label htmlFor="minOrderAmount">최소 주문 금액</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="1"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
                placeholder="30000"
              />
              <p className="text-xs text-muted-foreground">
                0원이면 최소 금액 제한 없음
              </p>
            </div>

            {/* 최대 할인 금액 (퍼센트인 경우) */}
            {formData.discountType === "PERCENTAGE" && (
              <div className="grid gap-2">
                <Label htmlFor="maxDiscountAmount">최대 할인 금액</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value,
                    })
                  }
                  placeholder="50000"
                />
                <p className="text-xs text-muted-foreground">
                  비워두면 최대 금액 제한 없음
                </p>
              </div>
            )}

            {/* 유효기간 시작 */}
            <div className="grid gap-2">
              <Label htmlFor="startDate">
                시작일 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            {/* 유효기간 종료 */}
            <div className="grid gap-2">
              <Label htmlFor="endDate">
                종료일 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>

            {/* 총 발급 수량 */}
            <div className="grid gap-2">
              <Label htmlFor="totalQuantity">총 발급 수량</Label>
              <Input
                id="totalQuantity"
                type="number"
                step="1"
                min="1"
                value={formData.totalQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, totalQuantity: e.target.value })
                }
                placeholder="무제한"
              />
              <p className="text-xs text-muted-foreground">
                비워두면 무제한 발급
              </p>
            </div>

            {/* 사용 타입 */}
            <div className="grid gap-2">
              <Label htmlFor="usageType">
                사용 타입 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.usageType}
                onValueChange={(value) =>
                  setFormData({ ...formData, usageType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_USE">1회 사용</SelectItem>
                  <SelectItem value="MULTI_USE">다회 사용</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 적용 카테고리 */}
            <div className="grid gap-2">
              <Label htmlFor="applicableCategory">적용 카테고리</Label>
              <Select
                value={formData.applicableCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, applicableCategory: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체 카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체 카테고리</SelectItem>
                  <SelectItem value="채소">채소</SelectItem>
                  <SelectItem value="과일">과일</SelectItem>
                  <SelectItem value="수산물">수산물</SelectItem>
                  <SelectItem value="축산물">축산물</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                비워두면 모든 상품에 적용
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
