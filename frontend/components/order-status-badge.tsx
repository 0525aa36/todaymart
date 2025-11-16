import { Badge } from "@/components/ui/badge"

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_PAYMENT: "결제 대기",
      PAYMENT_FAILED: "결제 실패",
      PENDING: "결제대기",
      PAID: "결제완료",
      PREPARING: "상품 준비중",
      SHIPPED: "배송중",
      DELIVERED: "배송완료",
      CANCELLED: "주문 취소",
      RETURN_REQUESTED: "반품 요청",
      RETURN_APPROVED: "반품 승인",
      RETURN_COMPLETED: "반품 완료",
      PARTIALLY_RETURNED: "부분 반품",
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING_PAYMENT: "bg-yellow-500",
      PAYMENT_FAILED: "bg-red-600 text-white",
      PENDING: "bg-yellow-500",
      PAID: "bg-green-500",
      PREPARING: "bg-blue-500",
      SHIPPED: "bg-purple-500",
      DELIVERED: "bg-green-600",
      CANCELLED: "bg-red-600 text-white",
      RETURN_REQUESTED: "bg-orange-500",
      RETURN_APPROVED: "bg-orange-600",
      RETURN_COMPLETED: "bg-gray-500",
      PARTIALLY_RETURNED: "bg-gray-600",
    }
    return colorMap[status] || "bg-muted"
  }

  return (
    <Badge className={`${getStatusColor(status)} ${className || ""}`}>
      {getStatusLabel(status)}
    </Badge>
  )
}
