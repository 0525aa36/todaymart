"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Minus, Plus, X, ShoppingBag, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client"

interface Product {
  id: number
  name: string
  price: number
  discountedPrice: number
  discountRate: number | null
  imageUrl: string
  stock: number
  shippingFee: number
  canCombineShipping: boolean
  combineShippingUnit: number | null
  minOrderQuantity: number
  maxOrderQuantity: number | null
}

interface ProductOption {
  id: number
  name: string
  optionName: string
  optionValue: string
  additionalPrice: number
  stock: number
  isAvailable: boolean
}

interface CartItem {
  id: number
  product: Product
  productOption?: ProductOption | null
  quantity: number
  price: number
}

interface Cart {
  id: number
  cartItems: CartItem[]
}

export function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchCart()
  }, [])

  const fetchCart = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<Cart>("/api/cart", { auth: true })
      setCart(data)
      setSelectedItems(data.cartItems.map((item: CartItem) => item.id))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setCart(null)
      } else {
        console.error("Error fetching cart:", error)
        toast({
          title: "오류",
          description: getErrorMessage(error, "장바구니를 불러오는 중 오류가 발생했습니다."),
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, newQuantity: number, product: Product) => {
    const minQty = product.minOrderQuantity || 1
    const maxQty = product.maxOrderQuantity

    if (newQuantity < minQty) {
      toast({
        title: "수량 변경 불가",
        description: `${product.name} 상품의 최소 주문 수량은 ${minQty}개입니다.`,
        variant: "destructive",
      })
      return
    }

    if (maxQty && newQuantity > maxQty) {
      toast({
        title: "수량 변경 불가",
        description: `${product.name} 상품의 최대 주문 수량은 ${maxQty}개입니다.`,
        variant: "destructive",
      })
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/cart/items/${itemId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ quantity: newQuantity }),
        parseResponse: "none",
      })

      await fetchCart()

      // 장바구니 업데이트 이벤트 발생 - 헤더의 장바구니 개수가 즉시 업데이트됨
      console.log("[Cart Page] Dispatching cartUpdated event (update quantity)")
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "수량 변경 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const removeItem = async (itemId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      await fetchCart()
      setSelectedItems(selectedItems.filter((id) => id !== itemId))

      // 장바구니 업데이트 이벤트 발생 - 헤더의 장바구니 개수가 즉시 업데이트됨
      console.log("[Cart Page] Dispatching cartUpdated event (remove item)")
      window.dispatchEvent(new Event("cartUpdated"))

      toast({
        title: "삭제 완료",
        description: "상품이 장바구니에서 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const toggleSelectItem = (id: number) => {
    setSelectedItems(
      selectedItems.includes(id) ? selectedItems.filter((itemId) => itemId !== id) : [...selectedItems, id],
    )
  }

  const toggleSelectAll = () => {
    if (!cart) return
    setSelectedItems(selectedItems.length === cart.cartItems.length ? [] : cart.cartItems.map((item) => item.id))
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

  const cartItems = cart?.cartItems || []
  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id))
  const totalProductPrice = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 합포장 배송비 계산 함수
  const calculateShipping = (item: CartItem): number => {
    const product = item.product
    if (!product.shippingFee) return 0

    // 합포장 가능한 경우
    if (product.canCombineShipping && product.combineShippingUnit) {
      const boxes = Math.ceil(item.quantity / product.combineShippingUnit)
      return boxes * product.shippingFee
    }

    // 합포장 불가능한 경우 - 각 개별로 배송비
    return item.quantity * product.shippingFee
  }

  const totalShipping = selectedCartItems.reduce((sum, item) => sum + calculateShipping(item), 0)
  const finalTotal = totalProductPrice + totalShipping

  // 최소/최대 주문 수량 검증
  const validateOrderQuantities = (): boolean => {
    for (const item of selectedCartItems) {
      const product = item.product
      const minQty = product.minOrderQuantity || 1
      const maxQty = product.maxOrderQuantity

      if (item.quantity < minQty) {
        toast({
          title: "주문 수량 오류",
          description: `${product.name} 상품의 최소 주문 수량은 ${minQty}개입니다.`,
          variant: "destructive",
        })
        return false
      }

      if (maxQty && item.quantity > maxQty) {
        toast({
          title: "주문 수량 오류",
          description: `${product.name} 상품의 최대 주문 수량은 ${maxQty}개입니다.`,
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleCheckout = () => {
    if (selectedItems.length === 0) return
    if (validateOrderQuantities()) {
      router.push("/checkout")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">장바구니</h1>

          {cartItems.length === 0 ? (
            <Card className="py-20">
              <CardContent className="text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">장바구니가 비어있습니다</h2>
                <p className="text-muted-foreground mb-6">신선한 상품을 담아보세요</p>
                <Button asChild>
                  <Link href="/">쇼핑 계속하기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Select All */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedItems.length === cartItems.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <label htmlFor="select-all" className="font-medium cursor-pointer">
                          전체선택 ({selectedItems.length}/{cartItems.length})
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          selectedItems.forEach((id) => removeItem(id))
                        }}
                        disabled={selectedItems.length === 0}
                      >
                        선택삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Cart Items List */}
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                          className="mt-1"
                        />

                        <Link href={`/product/${item.product.id}`} className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.product.imageUrl || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.product.id}`}>
                            <h3 className="font-semibold mb-1 hover:text-primary transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>

                          {item.productOption && (
                            <div className="text-sm text-muted-foreground mb-2">
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
                            <div className="text-sm text-gray-400 line-through mb-1">
                              {/* 원가 + 옵션 추가 가격 */}
                              {(item.product.price + (item.productOption?.additionalPrice || 0)).toLocaleString()}원
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            {item.product.discountRate && item.product.discountRate > 0 && (
                              <span className="text-lg font-bold text-orange-500">{item.product.discountRate}%</span>
                            )}
                            {/* item.price는 이미 할인가 + 옵션가격이 포함된 최종 가격 */}
                            <span className="text-lg font-bold">{item.price.toLocaleString()}원</span>
                          </div>

                          {/* 최소 주문 수량 안내 */}
                          {item.product.minOrderQuantity > 1 && (
                            <div className="text-sm text-orange-600 mb-2">
                              ⚠️ 최소 주문 수량: {item.product.minOrderQuantity}개
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.product)}
                                disabled={item.quantity <= (item.product.minOrderQuantity || 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                readOnly
                                className="w-16 h-8 text-center p-0"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.product)}
                                disabled={
                                  (item.product.maxOrderQuantity !== null && item.quantity >= item.product.maxOrderQuantity) ||
                                  item.quantity >= item.product.stock
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>
                              배송비 {calculateShipping(item) > 0
                                ? `${calculateShipping(item).toLocaleString()}원`
                                : '무료'}
                            </span>
                            {item.product.canCombineShipping && item.product.combineShippingUnit && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                ({Math.ceil(item.quantity / item.product.combineShippingUnit)}박스)
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-lg">{(item.price * item.quantity).toLocaleString()}원</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-6">주문 요약</h2>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">상품금액</span>
                          <span>{totalProductPrice.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">배송비</span>
                          <span>{totalShipping === 0 ? "무료" : `${totalShipping.toLocaleString()}원`}</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between mb-6">
                        <span className="text-lg font-semibold">총 결제금액</span>
                        <span className="text-2xl font-bold text-primary">{finalTotal.toLocaleString()}원</span>
                      </div>

                      <Button
                        className="w-full mb-3"
                        size="lg"
                        disabled={selectedItems.length === 0}
                        onClick={handleCheckout}
                      >
                        주문하기
                      </Button>

                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href="/">쇼핑 계속하기</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Benefits */}
                  <Card className="mt-4">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">혜택 안내</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>3만원 이상 구매 시 무료배송</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>신선도 보장 - 불만족 시 100% 환불</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>구매금액의 1% 적립</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

