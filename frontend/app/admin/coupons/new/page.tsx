"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import type { DiscountType, CouponUsageType } from "@/types/coupon"

export default function NewCouponPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "FIXED_AMOUNT" as DiscountType,
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    totalQuantity: "",
    isActive: true,
    usageType: "MULTI_USE" as CouponUsageType,
    applicableCategory: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requestBody: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalQuantity: formData.totalQuantity ? parseInt(formData.totalQuantity) : undefined,
        isActive: formData.isActive,
        usageType: formData.usageType,
        applicableCategory: formData.applicableCategory || undefined,
      }

      await apiFetch("/api/admin/coupons", {
        method: "POST",
        auth: true,
        body: JSON.stringify(requestBody),
        parseResponse: "none",
      })

      toast({
        title: "쿠폰 등록 성공",
        description: "쿠폰이 성공적으로 등록되었습니다.",
      })

      router.push("/admin/coupons")
    } catch (error) {
      console.error("Error creating coupon:", error)
      toast({
        title: "등록 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/coupons">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            쿠폰 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>쿠폰 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">쿠폰 코드 *</Label>
                  <Input
                    id="code"
                    required
                    placeholder="WELCOME2024"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-muted-foreground">영문 대문자와 숫자만 입력 가능</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">쿠폰 이름 *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="신규 회원 환영 쿠폰"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="쿠폰에 대한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* 할인 정보 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">할인 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">할인 타입 *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: DiscountType) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_AMOUNT">정액 할인</SelectItem>
                      <SelectItem value="PERCENTAGE">정률 할인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    할인 값 * {formData.discountType === "PERCENTAGE" ? "(%)" : "(원)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    required
                    min="0"
                    step={formData.discountType === "PERCENTAGE" ? "0.01" : "1"}
                    max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                    placeholder={formData.discountType === "PERCENTAGE" ? "10" : "5000"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">최소 주문 금액 (원)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">0원 또는 빈 값이면 제한 없음</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDiscountAmount">최대 할인 금액 (원)</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="비워두면 제한 없음"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">정률 할인 시 유용</p>
                </div>
              </div>
            </div>

            {/* 사용 조건 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">사용 조건</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일 *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">종료일 *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalQuantity">총 발급 수량</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="비워두면 무제한"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usageType">사용 타입 *</Label>
                  <Select
                    value={formData.usageType}
                    onValueChange={(value: CouponUsageType) => setFormData({ ...formData, usageType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_USE">1회 사용</SelectItem>
                      <SelectItem value="MULTI_USE">중복 사용</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicableCategory">적용 카테고리</Label>
                <Input
                  id="applicableCategory"
                  placeholder="비워두면 전체 카테고리 적용"
                  value={formData.applicableCategory}
                  onChange={(e) => setFormData({ ...formData, applicableCategory: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">특정 카테고리에만 적용하려면 입력</p>
              </div>
            </div>

            {/* 기타 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">기타</h3>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">활성화 상태</Label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/coupons">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
