"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Ticket,
  TrendingUp,
  Users,
  ArrowUpRight
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { useNotifications } from "@/hooks/use-notifications"

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

interface OrderItem {
  id: number
  product: Product
  quantity: number
  price: number
}

interface Order {
  id: number
  createdAt: string
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  orderItems: OrderItem[]
  user: {
    id: number
    name: string
    email: string
    phone: string
  }
  recipientName: string
  recipientPhone: string
  shippingPostcode: string
  shippingAddressLine1: string
  shippingAddressLine2?: string
  senderName?: string
  senderPhone?: string
  deliveryMessage?: string
  trackingNumber?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // 관리자 실시간 알림 활성화
  useNotifications(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "접근 권한 없음",
        description: "관리자 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchData()

    // 새 주문 알림 이벤트 리스너
    const handleNewOrder = () => {
      console.log("새 주문 알림 수신, 데이터 새로고침...")
      fetchData()
    }

    window.addEventListener('new-order', handleNewOrder)
    return () => window.removeEventListener('new-order', handleNewOrder)
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Fetch orders (Admin - all orders)
      const ordersData = await apiFetch<{ content?: Order[] }>("/api/admin/orders", { auth: true })
      setOrders(ordersData.content || [])

      const productsData = await apiFetch<{ content?: Product[] }>("/api/products?size=1000")
      setProducts(productsData.content || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "데이터를 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock < 10).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">쇼핑몰 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 총 매출 */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">+12%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {totalSales.toLocaleString()}원
            </div>
            <p className="text-sm text-gray-500">총 매출</p>
          </CardContent>
        </Card>

        {/* 총 주문 */}
        <Link href="/admin/orders">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {totalOrders}건
              </div>
              <p className="text-sm text-gray-500">총 주문</p>
            </CardContent>
          </Card>
        </Link>

        {/* 총 상품 */}
        <Link href="/admin/products">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {totalProducts}개
              </div>
              <p className="text-sm text-gray-500">등록된 상품</p>
            </CardContent>
          </Card>
        </Link>

        {/* 재고 부족 */}
        <Link href="/admin/products">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {lowStockProducts}개
              </div>
              <p className="text-sm text-gray-500">재고 부족 (10개 미만)</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 빠른 작업 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">빠른 작업</CardTitle>
            <CardDescription className="text-sm">자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/orders" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">주문 관리</div>
                    <div className="text-xs text-gray-500">주문 목록 확인 및 처리</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/products" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-green-50 hover:text-green-700 hover:border-green-300">
                  <Package className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">상품 관리</div>
                    <div className="text-xs text-gray-500">상품 등록 및 수정</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/coupons" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300">
                  <Ticket className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">쿠폰 관리</div>
                    <div className="text-xs text-gray-500">쿠폰 생성 및 발급</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
            <CardDescription className="text-sm">최근 주문 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.slice(0, 5).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                최근 주문 내역이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders`}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.totalAmount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.orderStatus === 'PAID' ? '결제완료' :
                         order.orderStatus === 'SHIPPED' ? '배송중' :
                         order.orderStatus === 'DELIVERED' ? '배송완료' : '처리중'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
