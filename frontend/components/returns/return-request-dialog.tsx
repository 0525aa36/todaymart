"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    imageUrl: string
    price: number
  }
  quantity: number
  price: number
}

interface ReturnRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  orderItems: OrderItem[]
  onSuccess?: () => void
}

const RETURN_REASON_CATEGORIES = {
  DEFECTIVE_PRODUCT: "상품 불량",
  WRONG_DELIVERY: "오배송",
  PRODUCT_INFO_MISMATCH: "상품 정보 상이",
  DELIVERY_DELAY: "배송 지연",
  SIMPLE_CHANGE_OF_MIND: "단순 변심",
  SIZE_COLOR_MISMATCH: "사이즈/색상 불만",
  OTHER: "기타",
}

export function ReturnRequestDialog({
  open,
  onOpenChange,
  orderId,
  orderItems,
  onSuccess,
}: ReturnRequestDialogProps) {
  const { toast } = useToast()
  const [reasonCategory, setReasonCategory] = useState<string>("")
  const [detailedReason, setDetailedReason] = useState("")
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [eligibility, setEligibility] = useState<any>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const handleItemSelection = (itemId: number, quantity: number, checked: boolean) => {
    const newSelected = new Map(selectedItems)
    if (checked) {
      newSelected.set(itemId, quantity)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const checkEligibility = async () => {
    setCheckingEligibility(true)
    try {
      const data = await apiFetch<any>(`/api/returns/eligibility/${orderId}`, { auth: true })
      setEligibility(data)

      if (!data.eligible) {
        toast({
          title: "반품 불가",
          description: data.reason,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking eligibility:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "반품 가능 여부 확인 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleSubmit = async () => {
    if (!reasonCategory) {
      toast({
        title: "입력 오류",
        description: "반품 사유를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (detailedReason.length < 10) {
      toast({
        title: "입력 오류",
        description: "상세 사유는 10자 이상 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (selectedItems.size === 0) {
      toast({
        title: "입력 오류",
        description: "반품할 상품을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const returnItems: Record<number, number> = {}
      selectedItems.forEach((quantity, itemId) => {
        returnItems[itemId] = quantity
      })

      await apiFetch("/api/returns", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          orderId,
          reasonCategory,
          detailedReason,
          returnItems,
          proofImageUrls: [],
        }),
      })

      toast({
        title: "반품 요청 완료",
        description: "반품 요청이 접수되었습니다. 관리자 승인 후 진행됩니다.",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error requesting return:", error)
      toast({
        title: "반품 요청 실패",
        description: getErrorMessage(error, "반품 요청 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>반품 요청</DialogTitle>
          <DialogDescription>
            반품할 상품과 사유를 선택해주세요. 배송 완료 후 7일 이내 반품 가능합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Eligibility Check */}
          {!eligibility && (
            <Button
              variant="outline"
              onClick={checkEligibility}
              disabled={checkingEligibility}
              className="w-full"
            >
              {checkingEligibility ? "확인 중..." : "반품 가능 여부 확인"}
            </Button>
          )}

          {eligibility && !eligibility.eligible && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{eligibility.reason}</AlertDescription>
            </Alert>
          )}

          {eligibility && eligibility.eligible && (
            <>
              <Alert>
                <AlertDescription>
                  반품 가능 기간: {new Date(eligibility.returnDeadline).toLocaleDateString("ko-KR")}까지
                </AlertDescription>
              </Alert>

              {/* Item Selection */}
              <div className="space-y-2">
                <Label>반품 상품 선택</Label>
                <div className="space-y-3 border rounded-lg p-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) =>
                          handleItemSelection(item.id, item.quantity, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          수량: {item.quantity}개 | 금액: {(item.price * item.quantity).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Reason */}
              <div className="space-y-2">
                <Label htmlFor="reasonCategory">반품 사유 *</Label>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger id="reasonCategory">
                    <SelectValue placeholder="반품 사유를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RETURN_REASON_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Detailed Reason */}
              <div className="space-y-2">
                <Label htmlFor="detailedReason">상세 사유 * (최소 10자)</Label>
                <Textarea
                  id="detailedReason"
                  placeholder="반품 사유를 상세히 입력해주세요"
                  value={detailedReason}
                  onChange={(e) => setDetailedReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">{detailedReason.length}/1000자</p>
              </div>

              {/* Seller Fault Notice */}
              {reasonCategory && ["DEFECTIVE_PRODUCT", "WRONG_DELIVERY", "PRODUCT_INFO_MISMATCH", "DELIVERY_DELAY"].includes(reasonCategory) && (
                <Alert>
                  <AlertDescription>
                    판매자 귀책 사유로 배송비도 함께 환불됩니다.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !eligibility?.eligible}
          >
            {submitting ? "요청 중..." : "반품 요청"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
