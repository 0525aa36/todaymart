"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Package, MapPin, CreditCard, RotateCcw } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { ReturnRequestDialog } from "@/components/returns/return-request-dialog"

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

interface Order {
  id: number
  createdAt: string
  totalAmount: number
  couponDiscountAmount?: number
  shippingFee?: number
  finalAmount?: number
  orderStatus: string  // 통합된 상태
  orderItems: OrderItem[]
  recipientName: string
  recipientPhone: string
  shippingAddressLine1: string
  shippingAddressLine2: string
  shippingPostcode: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<Order>(`/api/orders/${params.id}`, { auth: true })
      console.log("Fetched order data:", data)
      console.log("Order status:", data.orderStatus)
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "주문 정보를 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    const confirmCancel = confirm("정말로 주문을 취소하시겠습니까?")
    if (!confirmCancel) return

    const token = localStorage.getItem("token")
    if (!token) return

    setCancelling(true)
    try {
      await apiFetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          cancellationReason: "고객 요청",
        }),
        parseResponse: "none",
      })

      toast({
        title: "주문 취소 완료",
        description: "주문이 성공적으로 취소되었습니다.",
      })
      fetchOrder()
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "주문 취소 실패",
        description: getErrorMessage(error, "주문 취소 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!order) return

    const confirmDelivery = confirm("배송을 확인하시겠습니까?")
    if (!confirmDelivery) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "배송 확인 완료",
        description: "구매가 확정되었습니다.",
      })
      fetchOrder()
    } catch (error) {
      console.error("Error confirming delivery:", error)
      toast({
        title: "배송 확인 실패",
        description: getErrorMessage(error, "배송 확인 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const getOrderStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_PAYMENT: "결제 대기",
      PAYMENT_FAILED: "결제 실패",
      PAID: "결제 완료",
      PREPARING: "상품 준비중",
      SHIPPED: "배송중",
      DELIVERED: "배송 완료",
      CANCELLED: "주문 취소",
      RETURN_REQUESTED: "반품 요청",
      RETURN_APPROVED: "반품 승인",
      RETURN_COMPLETED: "반품 완료",
      PARTIALLY_RETURNED: "부분 반품",
    }
    return statusMap[status] || status
  }

  const getOrderStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING_PAYMENT: "bg-yellow-500",
      PAYMENT_FAILED: "bg-destructive",
      PAID: "bg-primary",
      PREPARING: "bg-blue-500",
      SHIPPED: "bg-purple-500",
      DELIVERED: "bg-green-500",
      CANCELLED: "bg-gray-500",
      RETURN_REQUESTED: "bg-orange-500",
      RETURN_APPROVED: "bg-orange-600",
      RETURN_COMPLETED: "bg-gray-600",
      PARTIALLY_RETURNED: "bg-gray-600",
    }
    return colorMap[status] || "bg-muted"
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-center">로딩 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-center">주문 정보를 찾을 수 없습니다.</p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/mypage">마이페이지로 돌아가기</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">주문 상세</h1>
                <p className="text-muted-foreground">주문번호: #{order.id}</p>
              </div>
              <Badge className={getOrderStatusColor(order.orderStatus)}>
                {getOrderStatusLabel(order.orderStatus)}
              </Badge>
            </div>
          </div>

          {/* Order Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                주문 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">주문일시</span>
                  <p className="font-medium mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">주문 상태</span>
                  <p className="font-medium mt-1">{getOrderStatusLabel(order.orderStatus)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                배송지 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">받는 사람</span>
                <p className="font-medium mt-1">{order.recipientName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">연락처</span>
                <p className="font-medium mt-1">{order.recipientPhone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">배송지</span>
                <p className="font-medium mt-1">
                  [{order.shippingPostcode}] {order.shippingAddressLine1}
                  {order.shippingAddressLine2 && ` ${order.shippingAddressLine2}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>주문 상품</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.product.imageUrl || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">수량: {item.quantity}개</p>
                    <p className="font-semibold">{(item.price * item.quantity).toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품금액</span>
                <span className="font-medium">
                  {order.totalAmount.toLocaleString()}원
                </span>
              </div>
              {(order.couponDiscountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>쿠폰 할인</span>
                  <span className="font-medium">-{order.couponDiscountAmount!.toLocaleString()}원</span>
                </div>
              )}
              {(order.shippingFee ?? 0) > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">배송비</span>
                  <span className="font-medium">+{order.shippingFee!.toLocaleString()}원</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">배송비</span>
                  <span className="font-medium">무료</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">총 결제금액</span>
                <span className="text-2xl font-bold text-primary">
                  {(order.finalAmount || (order.totalAmount - (order.couponDiscountAmount || 0) + (order.shippingFee || 0))).toLocaleString()}원
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {order.orderStatus === "PAID" && (
              <Button variant="destructive" className="flex-1" onClick={handleCancelOrder} disabled={cancelling}>
                {cancelling ? "취소 처리 중..." : "주문 취소"}
              </Button>
            )}
            {order.orderStatus === "DELIVERED" && (
              <>
                <Button variant="outline" className="flex-1" onClick={handleConfirmDelivery}>
                  구매 확정
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setReturnDialogOpen(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  반품 신청
                </Button>
                <Button className="flex-1">리뷰 작성</Button>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Return Request Dialog */}
      {order && (
        <ReturnRequestDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          orderId={order.id}
          orderItems={order.orderItems}
          onSuccess={fetchOrder}
        />
      )}
    </div>
  )
}
