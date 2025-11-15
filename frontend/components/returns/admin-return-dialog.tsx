"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { AlertCircle, CheckCircle, XCircle, Package } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReturnItem {
  id: number
  orderItem: {
    id: number
    product: {
      name: string
    }
    quantity: number
  }
  quantity: number
  refundAmount: number
}

interface ReturnRequest {
  id: number
  order: {
    id: number
    user: {
      name: string
      email: string
    }
  }
  status: string
  reasonCategory: string
  detailedReason: string
  totalRefundAmount: number
  itemsRefundAmount: number
  shippingRefundAmount: number
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  completedAt?: string
  adminNote?: string
  returnItems: ReturnItem[]
}

interface AdminReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnRequest: ReturnRequest
  mode: "detail" | "approve" | "reject" | "complete"
  onSuccess?: () => void
}

export function AdminReturnDialog({
  open,
  onOpenChange,
  returnRequest,
  mode,
  onSuccess,
}: AdminReturnDialogProps) {
  const { toast } = useToast()
  const [adminNote, setAdminNote] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/admin/returns/${returnRequest.id}/approve`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ adminNote }),
      })

      toast({
        title: "승인 완료",
        description: "반품 요청이 승인되었습니다.",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error approving return:", error)
      toast({
        title: "승인 실패",
        description: getErrorMessage(error, "반품 승인 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "입력 오류",
        description: "거부 사유를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      await apiFetch(`/api/admin/returns/${returnRequest.id}/reject`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ rejectionReason }),
      })

      toast({
        title: "거부 완료",
        description: "반품 요청이 거부되었습니다.",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error rejecting return:", error)
      toast({
        title: "거부 실패",
        description: getErrorMessage(error, "반품 거부 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm("반품을 완료 처리하시겠습니까? 재고가 복원되고 환불이 진행됩니다.")) {
      return
    }

    setSubmitting(true)
    try {
      await apiFetch(`/api/admin/returns/${returnRequest.id}/complete`, {
        method: "POST",
        auth: true,
      })

      toast({
        title: "완료 처리",
        description: "반품이 완료되었습니다. 재고가 복원되고 환불이 진행됩니다.",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error completing return:", error)
      toast({
        title: "완료 실패",
        description: getErrorMessage(error, "반품 완료 처리 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      REQUESTED: "요청됨",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
      COMPLETED: "완료됨",
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      REQUESTED: "bg-yellow-500",
      APPROVED: "bg-blue-500",
      REJECTED: "bg-red-500",
      COMPLETED: "bg-green-500",
    }
    return colorMap[status] || "bg-gray-500"
  }

  const getReasonCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      DEFECTIVE_PRODUCT: "상품 불량",
      WRONG_DELIVERY: "오배송",
      PRODUCT_INFO_MISMATCH: "상품 정보 상이",
      DELIVERY_DELAY: "배송 지연",
      SIMPLE_CHANGE_OF_MIND: "단순 변심",
      SIZE_COLOR_MISMATCH: "사이즈/색상 불만",
      OTHER: "기타",
    }
    return categoryMap[category] || category
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isSellerFault = ["DEFECTIVE_PRODUCT", "WRONG_DELIVERY", "PRODUCT_INFO_MISMATCH", "DELIVERY_DELAY"].includes(
    returnRequest.reasonCategory
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>반품 요청 #{returnRequest.id}</span>
            <Badge className={getStatusColor(returnRequest.status)}>
              {getStatusLabel(returnRequest.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {mode === "detail" && "반품 요청 상세 정보"}
            {mode === "approve" && "반품 요청을 승인합니다"}
            {mode === "reject" && "반품 요청을 거부합니다"}
            {mode === "complete" && "반품을 완료 처리합니다 (재고 복원 + 환불)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">고객명</span>
              <p className="font-medium mt-1">{returnRequest.order.user.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">이메일</span>
              <p className="font-medium mt-1">{returnRequest.order.user.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">주문 번호</span>
              <p className="font-medium mt-1">#{returnRequest.order.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">요청 날짜</span>
              <p className="font-medium mt-1">{formatDate(returnRequest.requestedAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Return Items */}
          <div>
            <span className="text-sm font-medium">반품 상품</span>
            <div className="mt-2 space-y-2 bg-muted p-3 rounded">
              {returnRequest.returnItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.orderItem.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      반품 수량: {item.quantity}개 (주문 수량: {item.orderItem.quantity}개)
                    </p>
                  </div>
                  <p className="font-semibold">{item.refundAmount.toLocaleString()}원</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Reason */}
          <div>
            <span className="text-sm font-medium">반품 사유</span>
            <div className="mt-2 bg-muted p-3 rounded">
              <p className="font-medium mb-2">{getReasonCategoryLabel(returnRequest.reasonCategory)}</p>
              <p className="text-sm text-muted-foreground">{returnRequest.detailedReason}</p>
              {isSellerFault && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    판매자 귀책 사유로 배송비도 환불됩니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Refund Summary */}
          <div>
            <span className="text-sm font-medium">환불 금액</span>
            <div className="mt-2 bg-muted p-3 rounded space-y-2">
              <div className="flex justify-between text-sm">
                <span>상품 금액</span>
                <span>{returnRequest.itemsRefundAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>배송비</span>
                <span>{returnRequest.shippingRefundAmount.toLocaleString()}원</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">총 환불 금액</span>
                <span className="text-lg font-bold text-primary">
                  {returnRequest.totalRefundAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* Admin Note (existing) */}
          {returnRequest.adminNote && (
            <div>
              <span className="text-sm font-medium">관리자 메모</span>
              <div className="mt-2 bg-muted p-3 rounded">
                <p className="text-sm">{returnRequest.adminNote}</p>
              </div>
            </div>
          )}

          {/* Approve Form */}
          {mode === "approve" && (
            <div>
              <Label htmlFor="adminNote">관리자 메모 (선택)</Label>
              <Textarea
                id="adminNote"
                placeholder="승인 시 전달할 메시지를 입력하세요 (선택사항)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          {/* Reject Form */}
          {mode === "reject" && (
            <div>
              <Label htmlFor="rejectionReason">거부 사유 *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="반품을 거부하는 사유를 입력하세요"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
                required
              />
            </div>
          )}

          {/* Complete Warning */}
          {mode === "complete" && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                완료 처리 시 다음이 자동으로 진행됩니다:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>재고 자동 복원</li>
                  <li>Toss Payments API를 통한 실제 환불 처리</li>
                  <li>고객에게 완료 알림 발송</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {mode === "detail" ? "닫기" : "취소"}
          </Button>
          {mode === "approve" && (
            <Button onClick={handleApprove} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? "승인 중..." : "승인"}
            </Button>
          )}
          {mode === "reject" && (
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              <XCircle className="h-4 w-4 mr-2" />
              {submitting ? "거부 중..." : "거부"}
            </Button>
          )}
          {mode === "complete" && (
            <Button onClick={handleComplete} disabled={submitting}>
              <Package className="h-4 w-4 mr-2" />
              {submitting ? "처리 중..." : "완료 처리"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
