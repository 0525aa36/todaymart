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
import { AddressSearch } from "@/components/address-search"
import { PhoneInput } from "@/components/phone-input"
import CouponSelector from "@/components/coupon/CouponSelector"
import { UserCoupon } from "@/types/coupon"
import { AddressSelectorModal } from "@/components/address-selector-modal"

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

export function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [addressPrefilled, setAddressPrefilled] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    shippingPostcode: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    deliveryRequest: "",
    senderName: "",
    senderPhone: "",
    deliveryMessage: "",
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
    prefillUserInfo()
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

  const prefillUserInfo = async () => {
    const token = localStorage.getItem("token")
    if (!token || addressPrefilled) return

    try {
      // Fetch user information
      const user = await apiFetch<{ name: string; phone: string }>("/api/auth/me", { auth: true })

      // Fetch user addresses
      const addresses = await apiFetch<UserAddress[]>("/api/addresses", { auth: true })

      // Find default address or use the first one
      const defaultAddress = addresses.length > 0
        ? (addresses.find((addr) => addr.isDefault) ?? addresses[0])
        : null

      // Pre-fill form with user info and address
      setFormData((prev) => ({
        ...prev,
        recipientName: prev.recipientName || (defaultAddress?.recipient || user.name),
        recipientPhone: prev.recipientPhone || (defaultAddress?.phone || user.phone),
        shippingPostcode: prev.shippingPostcode || (defaultAddress?.postcode || ""),
        shippingAddressLine1: prev.shippingAddressLine1 || (defaultAddress?.addressLine1 || ""),
        shippingAddressLine2: prev.shippingAddressLine2 || (defaultAddress?.addressLine2 || ""),
      }))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // 사용자 인증이 만료된 경우 정보 선입력을 건너뜁니다.
        return
      }
      console.error("Error pre-filling user info:", error)
    } finally {
      setAddressPrefilled(true)
    }
  }

  const orderItems = cart?.cartItems || []
  const totalProductPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = totalProductPrice >= 30000 ? 0 : 3000

  // 쿠폰 할인 계산
  const calculateCouponDiscount = () => {
    if (!selectedCoupon) return 0;

    const coupon = selectedCoupon.coupon;
    let discount = 0;

    if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.discountValue;
    } else {
      discount = totalProductPrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }

    return Math.min(discount, totalProductPrice);
  };

  const couponDiscount = calculateCouponDiscount();
  const finalTotal = totalProductPrice - couponDiscount + shippingFee

  const handleSelectAddress = (address: UserAddress) => {
    setFormData({
      ...formData,
      recipientName: address.recipient,
      recipientPhone: address.phone,
      shippingPostcode: address.postcode,
      shippingAddressLine1: address.addressLine1,
      shippingAddressLine2: address.addressLine2,
    })
  }

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
          senderName: formData.senderName || undefined,
          senderPhone: formData.senderPhone || undefined,
          deliveryMessage: formData.deliveryMessage || formData.deliveryRequest,
          couponId: selectedCoupon?.id || undefined,
          items: orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      })

      toast({
        title: "주문 생성 완료",
        description: "결제 페이지로 이동합니다.",
      })
      router.push(`/payment/${order.id}`)
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
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <span className="ml-2 text-sm font-medium">배송정보</span>
            </div>

            <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
                2
              </div>
              <span className="ml-2 text-sm font-medium">결제하기</span>
            </div>

            <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
                3
              </div>
              <span className="ml-2 text-sm font-medium">주문완료</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle>주문자 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name">이름 *</Label>
                      <Input
                        id="recipient-name"
                        placeholder="홍길동"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient-phone">휴대폰 번호 *</Label>
                      <PhoneInput
                        id="recipient-phone"
                        value={formData.recipientPhone}
                        onChange={(value) => setFormData({ ...formData, recipientPhone: value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 배송지 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>배송지 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">주소 *</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="zipcode"
                        placeholder="우편번호"
                        className="w-32"
                        value={formData.shippingPostcode}
                        onChange={(e) => setFormData({ ...formData, shippingPostcode: e.target.value })}
                        readOnly
                      />
                      <AddressSearch
                        onComplete={(data) => {
                          setFormData({
                            ...formData,
                            shippingPostcode: data.zonecode,
                            shippingAddressLine1: data.address,
                          })
                        }}
                        buttonText="주소검색"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddressModalOpen(true)}
                      >
                        변경
                      </Button>
                    </div>
                    <Input
                      id="address"
                      placeholder="기본주소"
                      className="mb-2"
                      value={formData.shippingAddressLine1}
                      onChange={(e) => setFormData({ ...formData, shippingAddressLine1: e.target.value })}
                      readOnly
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

                  {/* 쿠폰 선택 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>쿠폰 / 할인</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CouponSelector
                        orderAmount={totalProductPrice}
                        onCouponSelect={setSelectedCoupon}
                        selectedCoupon={selectedCoupon}
                      />
                    </CardContent>
                  </Card>

                  <Button className="w-full" size="lg" onClick={handleCreateOrder} disabled={submitting}>
                    {submitting ? "처리 중..." : "다음 단계 (결제)"}
                  </Button>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* 주문 요약 */}
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
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>쿠폰 할인</span>
                          <span>-{couponDiscount.toLocaleString()}원</span>
                        </div>
                      )}
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

      <AddressSelectorModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={handleSelectAddress}
      />
    </div>
  )
}

