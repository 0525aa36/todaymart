"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { Loader2 } from "lucide-react"
import { AdminLoadingSpinner, LOADING_MESSAGES } from "@/components/admin/AdminLoadingSpinner"
import Image from "next/image"

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ""

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    price: number
    discountedPrice: number
    discountRate: number | null
    imageUrl: string
  }
  productOption?: {
    id: number
    name: string
    optionValue: string
    additionalPrice: number
  } | null
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  totalAmount: number
  couponDiscountAmount?: number
  shippingFee?: number
  finalAmount?: number
  recipientName: string
  orderItems?: OrderItem[]
  user: {
    id: number
    email: string
  }
}

export default function PaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderId = params.orderId as string
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null)
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [widgetReady, setWidgetReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "결제하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const data = await apiFetch<Order>(`/api/orders/${orderId}`, { auth: true })
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
      toast({
        title: "오류",
        description: "주문 정보를 불러올 수 없습니다.",
        variant: "destructive",
      })
      router.push("/cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!order) return

    const initializeWidget = async () => {
      try {
        // 디버깅: Client Key 확인 (보안을 위해 일부만 표시)
        console.log("[Payment] Toss Client Key:", clientKey ? `${clientKey.substring(0, 10)}...` : "NOT SET")
        console.log("[Payment] Order ID:", order.id)
        console.log("[Payment] Total Amount:", order.totalAmount)

        if (!clientKey) {
          // 클라이언트 키가 설정되지 않음
          console.warn("[Payment] 토스페이먼츠 API 키가 설정되지 않았습니다.")
          toast({
            title: "결제 설정 필요",
            description: "토스페이먼츠 API 키가 설정되지 않았습니다. 개발자에게 문의하세요.",
            variant: "destructive",
          })
          setWidgetReady(false)
          return
        }

        // 테스트 키 사용 여부 로그
        if (clientKey.startsWith('test_')) {
          console.log("[Payment] 테스트 환경으로 결제를 진행합니다. 실제 출금되지 않습니다.")
        }

        const customerKey = `customer_${order.user.id}_${Date.now()}`

        console.log("[Payment] Loading payment widget...")
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey)
        paymentWidgetRef.current = paymentWidget
        console.log("[Payment] Payment widget loaded successfully")

        // DOM 요소가 존재하는지 확인
        const element = document.getElementById("payment-widget")
        if (!element) {
          console.error("[Payment] Payment widget container not found")
          return
        }

        // Calculate final payment amount
        const paymentAmount = order.finalAmount || (order.totalAmount - (order.couponDiscountAmount || 0) + (order.shippingFee || 0))

        // 0원 주문은 위젯 렌더링 건너뛰기
        if (paymentAmount === 0) {
          console.log("[Payment] Skipping widget rendering for 0 won order")
          setWidgetReady(true)
          return
        }

        // 위젯 렌더링
        console.log("[Payment] Rendering payment methods...")
        console.log("[Payment] Payment amount:", paymentAmount)
        await paymentWidget.renderPaymentMethods(
          "#payment-widget",
          { value: paymentAmount },
          { variantKey: "DEFAULT" }
        )
        console.log("[Payment] Payment methods rendered successfully")

        setWidgetReady(true)
      } catch (error) {
        console.error("[Payment] Error initializing payment widget:", error)
        setWidgetReady(false)
        toast({
          title: "결제 위젯 로드 실패",
          description: error instanceof Error ? error.message : "결제 위젯을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.",
          variant: "destructive",
        })
      }
    }

    // DOM이 완전히 로드된 후 초기화
    const timer = setTimeout(initializeWidget, 500)
    return () => clearTimeout(timer)
  }, [order, clientKey, toast])

  const handlePayment = async () => {
    if (!order) {
      toast({
        title: "오류",
        description: "주문 정보를 찾을 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    // 0원 주문은 결제 없이 바로 완료 처리
    const paymentAmount = order.finalAmount ?? order.totalAmount
    if (paymentAmount === 0) {
      toast({
        title: "주문 완료",
        description: "0원 주문이 완료되었습니다.",
      })
      router.push(`/mypage/orders/${order.id}`)
      return
    }

    if (!paymentWidgetRef.current || !widgetReady) {
      toast({
        title: "결제 준비 중",
        description: "결제 위젯이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const orderNumber = order.orderNumber || `ORDER_${order.id}_${Date.now()}`

      // 주문 상품명 생성: 첫 번째 상품명 + 외 N개
      let orderName = `주문 ${order.id}` // 기본값
      if (order.orderItems && order.orderItems.length > 0) {
        const firstProduct = order.orderItems[0].product?.name || `상품 ${order.orderItems[0].id}`
        if (order.orderItems.length === 1) {
          orderName = firstProduct
        } else {
          orderName = `${firstProduct} 외 ${order.orderItems.length - 1}개`
        }
      }

      await paymentWidgetRef.current.requestPayment({
        orderId: orderNumber,
        orderName: orderName,
        customerName: order.recipientName,
        successUrl: `${window.location.origin}/payment/success?orderDbId=${order.id}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error("Payment request error:", error)
      toast({
        title: "결제 요청 실패",
        description: "결제 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (loading || !order) {
    return null
  }

  // Calculate final payment amount
  const paymentAmount = order.finalAmount || (order.totalAmount - (order.couponDiscountAmount || 0) + (order.shippingFee || 0))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">결제</h1>

          {/* 주문 상품 목록 */}
          {order.orderItems && order.orderItems.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>주문 상품</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{item.product.name}</h4>

                      {item.productOption && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">옵션:</span> {item.productOption.optionValue || item.productOption.name}
                          {item.productOption.additionalPrice !== 0 && (
                            <span className="ml-1">
                              ({item.productOption.additionalPrice > 0 ? "+" : ""}
                              {item.productOption.additionalPrice.toLocaleString()}원)
                            </span>
                          )}
                        </div>
                      )}

                      {item.product.discountRate && item.product.discountRate > 0 && (
                        <div className="text-xs text-gray-400 line-through mb-1">
                          {item.product.price.toLocaleString()}원
                          {item.productOption && item.productOption.additionalPrice !== 0 && (
                            <span className="ml-1">
                              ({item.productOption.additionalPrice > 0 ? "+" : ""}
                              {item.productOption.additionalPrice.toLocaleString()}원)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        {item.product.discountRate && item.product.discountRate > 0 && (
                          <span className="text-sm font-bold text-orange-500">{item.product.discountRate}%</span>
                        )}
                        <span className="text-sm font-bold">{item.price.toLocaleString()}원</span>
                        <span className="text-xs text-muted-foreground">× {item.quantity}개</span>
                      </div>

                      <div className="text-sm font-semibold text-right">
                        {(item.price * item.quantity).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>주문 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">받는 사람</span>
                <span>{order.recipientName}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">상품 금액</span>
                <span>{order.totalAmount.toLocaleString()}원</span>
              </div>
              {(order.couponDiscountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>쿠폰 할인</span>
                  <span>-{order.couponDiscountAmount.toLocaleString()}원</span>
                </div>
              )}
              {(order.shippingFee ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">배송비</span>
                  <span>+{order.shippingFee.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>최종 결제 금액</span>
                <span className="text-primary">{paymentAmount.toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>

          {paymentAmount > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>결제 수단 선택</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div id="payment-widget" className="min-h-[300px]"></div>
                {!widgetReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <AdminLoadingSpinner
                      message="결제 위젯을 불러오는 중..."
                      size="lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>결제 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center space-y-4">
                    <div className="text-green-600 dark:text-green-400">
                      <p className="text-lg font-semibold mb-2">✓ 결제 금액이 0원입니다</p>
                      <p className="text-sm text-muted-foreground">
                        할인이 적용되어 결제할 금액이 없습니다.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        아래 버튼을 눌러 주문을 완료해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentAmount > 0 ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
            >
              {`${paymentAmount.toLocaleString()}원 결제하기`}
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
            >
              주문 완료하기
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
