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

  const getStatusStyle = (status: string) => {
    const styleMap: Record<string, { backgroundColor: string; color: string }> = {
      PENDING_PAYMENT: { backgroundColor: "var(--status-pending)", color: "white" },
      PAYMENT_FAILED: { backgroundColor: "var(--color-danger)", color: "white" },
      PENDING: { backgroundColor: "var(--status-pending)", color: "white" },
      PAID: { backgroundColor: "var(--status-paid)", color: "white" },
      PREPARING: { backgroundColor: "var(--status-preparing)", color: "white" },
      SHIPPED: { backgroundColor: "var(--status-shipped)", color: "white" },
      DELIVERED: { backgroundColor: "var(--status-delivered)", color: "white" },
      CANCELLED: { backgroundColor: "var(--status-cancelled)", color: "white" },
      RETURN_REQUESTED: { backgroundColor: "var(--status-return)", color: "white" },
      RETURN_APPROVED: { backgroundColor: "#EA580C", color: "white" },
      RETURN_COMPLETED: { backgroundColor: "#6B7280", color: "white" },
      PARTIALLY_RETURNED: { backgroundColor: "#4B5563", color: "white" },
    }
    return styleMap[status] || { backgroundColor: "var(--color-muted)", color: "var(--color-foreground)" }
  }

  return (
    <Badge style={getStatusStyle(status)} className={className}>
      {getStatusLabel(status)}
    </Badge>
  )
}
