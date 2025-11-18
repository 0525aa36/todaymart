"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { OrderStatusBadge } from "@/components/order-status-badge"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  Gift,
  Bell,
  Settings,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle,
  Ticket,
  MessageSquare,
} from "lucide-react"

interface User {
  id: number
  name: string
  email: string
}

interface OrderItem {
  id: number
  productId: number | null
  productName: string
  productImageUrl: string
  productOptionId?: number | null
  productOptionName?: string
  optionValue?: string
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  createdAt: string
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  orderItems: OrderItem[]
}

interface UserCoupon {
  id: number
  isUsed: boolean
  expiresAt: string
}

export function MyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [couponCount, setCouponCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }

    fetchOrders()
    fetchCouponCount()
  }, [])

  const fetchOrders = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<Order[]>("/api/orders", { auth: true })
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "주문 내역을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCouponCount = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<UserCoupon[]>("/api/user/coupons/available", { auth: true })
      setCouponCount(data.length)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      // Don't show error toast for coupons as it's not critical
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // Calculate order statistics
  const orderStats = [
    {
      label: "결제완료",
      count: orders.filter((o) => o.orderStatus === "PAID").length,
      icon: CreditCard,
    },
    {
      label: "배송준비",
      count: orders.filter((o) => o.orderStatus === "PAID" && o.paymentStatus === "PAID").length,
      icon: Package,
    },
    {
      label: "배송중",
      count: orders.filter((o) => o.orderStatus === "SHIPPED").length,
      icon: Truck,
    },
    {
      label: "배송완료",
      count: orders.filter((o) => o.orderStatus === "DELIVERED").length,
      icon: CheckCircle,
    },
  ]

  // Get recent orders (최근 2개)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-primary">{user.name[0]}</span>
                    </div>
                    <h2 className="font-bold text-lg mb-1">{user.name}</h2>
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    <Badge className="bg-accent text-accent-foreground">일반 회원</Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">0</div>
                      <div className="text-xs text-muted-foreground">적립금</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{couponCount}</div>
                      <div className="text-xs text-muted-foreground">쿠폰</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <nav className="space-y-1">
                    <Link
                      href="/mypage/orders"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">주문내역</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mypage/wishlist"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">찜한상품</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mypage/coupons"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">쿠폰</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mypage/addresses"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">배송지 관리</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/help?tab=inquiries"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">1:1 문의</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mypage/settings"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">회원정보 수정</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>주문 현황</CardTitle>
                    <Link href="/mypage/orders">
                      <Button variant="ghost" size="sm">
                        전체보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {orderStats.map((stat, index) => (
                      <div
                        key={index}
                        className="text-center p-4 border rounded-lg hover:border-primary transition-colors"
                      >
                        <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold mb-1">{stat.count}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>최근 주문</CardTitle>
                    <Link href="/mypage/orders">
                      <Button variant="ghost" size="sm">
                        전체보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">주문 내역이 없습니다.</div>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">{formatDate(order.createdAt)}</div>
                            <div className="font-semibold">주문번호: {order.orderNumber}</div>
                          </div>
                          <OrderStatusBadge status={order.orderStatus} />
                        </div>

                        {order.orderItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex gap-4 mb-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <Image
                                src={item.productImageUrl || "/placeholder.svg"}
                                alt={item.productName || "상품"}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{item.productName || "상품 정보 없음"}</h4>
                              {item.optionValue && (
                                <p className="text-sm text-muted-foreground">옵션: {item.optionValue}</p>
                              )}
                              <p className="text-sm text-muted-foreground mb-2">수량: {item.quantity}개</p>
                              <p className="font-semibold">{item.price.toLocaleString()}원</p>
                            </div>
                          </div>
                        ))}

                        {order.orderItems.length > 2 && (
                          <p className="text-sm text-muted-foreground mb-4">
                            외 {order.orderItems.length - 2}개 상품
                          </p>
                        )}

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                          <span className="font-semibold">총 결제금액</span>
                          <span className="text-xl font-bold text-primary">{order.totalAmount.toLocaleString()}원</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1 bg-transparent" asChild>
                            <Link href={`/mypage/orders/${order.id}`}>주문상세</Link>
                          </Button>
                          {order.orderStatus === "DELIVERED" && (
                            <Button variant="outline" className="flex-1 bg-transparent">
                              리뷰작성
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>자주 찾는 메뉴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                      href="/mypage/wishlist"
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <Heart className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">찜한상품</span>
                    </Link>

                    <Link
                      href="/mypage/addresses"
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <MapPin className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">배송지관리</span>
                    </Link>

                    <Link
                      href="/mypage/reviews"
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <ShoppingBag className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">리뷰관리</span>
                    </Link>

                    <Link
                      href="/cart"
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <ShoppingBag className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">장바구니</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

