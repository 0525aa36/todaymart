"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ChevronRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client"

interface CartItem {
  id: number
  product: {
    id: number
    name: string
    price: number
    imageUrl: string
  }
  quantity: number
  price: number
}

interface Cart {
  id: number
  cartItems: CartItem[]
}

interface UserAddress {
  id: number
  label: string
  recipient: string
  phone: string
  postcode: string
  addressLine1: string
  addressLine2: string
  isDefault: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [addressPrefilled, setAddressPrefilled] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    shippingPostcode: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    deliveryRequest: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "주문하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchCart()
    prefillDefaultAddress()
  }, [])

  const fetchCart = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<Cart>("/api/cart", { auth: true })
      setCart(data)

      if (!data.cartItems || data.cartItems.length === 0) {
        toast({
          title: "장바구니가 비어있습니다",
          description: "주문할 상품을 먼저 담아주세요.",
          variant: "destructive",
        })
        router.push("/cart")
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "장바구니를 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const prefillDefaultAddress = async () => {
    const token = localStorage.getItem("token")
    if (!token || addressPrefilled) return

    try {
      const addresses = await apiFetch<UserAddress[]>("/api/addresses", { auth: true })
      if (!addresses.length) return
      const defaultAddress = addresses.find((addr) => addr.isDefault) ?? addresses[0]
      setFormData((prev) => ({
        ...prev,
        recipientName: prev.recipientName || defaultAddress.recipient,
        recipientPhone: prev.recipientPhone || defaultAddress.phone,
        shippingPostcode: prev.shippingPostcode || defaultAddress.postcode,
        shippingAddressLine1: prev.shippingAddressLine1 || defaultAddress.addressLine1,
        shippingAddressLine2: prev.shippingAddressLine2 || defaultAddress.addressLine2 || "",
      }))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // 사용자 인증이 만료된 경우 주소 선입력을 건너뜁니다.
        return
      }
      console.error("Error pre-filling address:", error)
    } finally {
      setAddressPrefilled(true)
    }
  }

  const orderItems = cart?.cartItems || []
  const totalProductPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = totalProductPrice >= 30000 ? 0 : 3000
  const finalTotal = totalProductPrice + shippingFee

  const handleCreateOrder = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    // Validation
    if (!formData.recipientName || !formData.recipientPhone || !formData.shippingPostcode || !formData.shippingAddressLine1) {
      toast({
        title: "입력 오류",
        description: "배송 정보를 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const order = await apiFetch<{ id: number }>("/api/orders", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          shippingPostcode: formData.shippingPostcode,
          shippingAddressLine1: formData.shippingAddressLine1,
          shippingAddressLine2: formData.shippingAddressLine2,
          items: orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      })

      toast({
        title: "주문 완료",
        description: "주문이 성공적으로 완료되었습니다.",
      })
      router.push(`/mypage/orders/${order.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "주문 실패",
        description: getErrorMessage(error, "주문 처리 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <p className="text-center">로딩 중...</p>
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
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">주문/결제</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="h-5 w-5" /> : "1"}
              </div>
              <span className="ml-2 text-sm font-medium">배송정보</span>
            </div>

            <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > 2 ? <Check className="h-5 w-5" /> : "2"}
              </div>
              <span className="ml-2 text-sm font-medium">결제하기</span>
            </div>

            <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium">주문완료</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Shipping Information */}
              {step === 1 && (
                <>
                  {/* Shipping Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>배송지 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="recipient-name">받는 사람 *</Label>
                          <Input
                            id="recipient-name"
                            placeholder="홍길동"
                            value={formData.recipientName}
                            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recipient-phone">휴대폰 번호 *</Label>
                          <Input
                            id="recipient-phone"
                            placeholder="010-0000-0000"
                            value={formData.recipientPhone}
                            onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">주소 *</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            id="zipcode"
                            placeholder="우편번호"
                            className="w-32"
                            value={formData.shippingPostcode}
                            onChange={(e) => setFormData({ ...formData, shippingPostcode: e.target.value })}
                          />
                          <Button type="button" variant="outline">
                            주소검색
                          </Button>
                        </div>
                        <Input
                          id="address"
                          placeholder="기본주소"
                          className="mb-2"
                          value={formData.shippingAddressLine1}
                          onChange={(e) => setFormData({ ...formData, shippingAddressLine1: e.target.value })}
                        />
                        <Input
                          id="address-detail"
                          placeholder="상세주소를 입력하세요"
                          value={formData.shippingAddressLine2}
                          onChange={(e) => setFormData({ ...formData, shippingAddressLine2: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery-request">배송 요청사항</Label>
                        <Textarea
                          id="delivery-request"
                          placeholder="배송 시 요청사항을 입력해주세요"
                          rows={3}
                          value={formData.deliveryRequest}
                          onChange={(e) => setFormData({ ...formData, deliveryRequest: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>배송 방법</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                        <div className="flex items-center justify-between p-4 border rounded-lg mb-3">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <div>
                              <Label htmlFor="standard" className="font-semibold cursor-pointer">
                                일반배송
                              </Label>
                              <p className="text-sm text-muted-foreground">2-3일 소요</p>
                            </div>
                          </div>
                          <span className="font-semibold">무료</span>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="dawn" id="dawn" />
                            <div>
                              <Label htmlFor="dawn" className="font-semibold cursor-pointer">
                                새벽배송
                              </Label>
                              <p className="text-sm text-muted-foreground">다음날 오전 7시 전 도착</p>
                            </div>
                          </div>
                          <span className="font-semibold">+3,000원</span>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                    다음 단계
                  </Button>
                </>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <>
                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>결제 수단</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex-1 cursor-pointer">
                              신용카드 / 체크카드
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="transfer" id="transfer" />
                            <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                              실시간 계좌이체
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="vbank" id="vbank" />
                            <Label htmlFor="vbank" className="flex-1 cursor-pointer">
                              무통장 입금
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="phone" id="phone" />
                            <Label htmlFor="phone" className="flex-1 cursor-pointer">
                              휴대폰 결제
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="kakao" id="kakao" />
                            <Label htmlFor="kakao" className="flex-1 cursor-pointer">
                              카카오페이
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="naver" id="naver" />
                            <Label htmlFor="naver" className="flex-1 cursor-pointer">
                              네이버페이
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Coupon & Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle>할인 / 적립</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>쿠폰</Label>
                        <div className="flex gap-2">
                          <Input placeholder="쿠폰을 선택하세요" readOnly />
                          <Button variant="outline">선택</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">사용 가능한 쿠폰 3장</p>
                      </div>

                      <div className="space-y-2">
                        <Label>적립금</Label>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="0" />
                          <Button variant="outline">전액사용</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">보유 적립금: 5,000원</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Agreement */}
                  <Card>
                    <CardHeader>
                      <CardTitle>주문 동의</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox id="agree-all" />
                        <label htmlFor="agree-all" className="font-semibold cursor-pointer">
                          전체 동의
                        </label>
                      </div>

                      <Separator />

                      <div className="space-y-2 pl-6">
                        <div className="flex items-start space-x-2">
                          <Checkbox id="agree-terms" />
                          <label htmlFor="agree-terms" className="text-sm cursor-pointer">
                            [필수] 개인정보 수집 및 이용 동의
                          </label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox id="agree-payment" />
                          <label htmlFor="agree-payment" className="text-sm cursor-pointer">
                            [필수] 결제대행 서비스 이용약관 동의
                          </label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox id="agree-order" />
                          <label htmlFor="agree-order" className="text-sm cursor-pointer">
                            [필수] 주문 내용 확인 및 결제 동의
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                      이전
                    </Button>
                    <Button className="flex-1" size="lg" onClick={handleCreateOrder} disabled={submitting}>
                      {submitting ? "처리 중..." : `${finalTotal.toLocaleString()}원 결제하기`}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>주문 상품</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.product.imageUrl || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 mb-1">{item.product.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">수량: {item.quantity}</span>
                            <span className="text-sm font-semibold">
                              {(item.price * item.quantity).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">상품금액</span>
                        <span>{totalProductPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">배송비</span>
                        <span>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString()}원`}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">총 결제금액</span>
                      <span className="text-2xl font-bold text-primary">{finalTotal.toLocaleString()}원</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
