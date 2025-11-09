"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Ticket,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">농수산물 쇼핑몰 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground mt-1">누적 매출액</p>
          </CardContent>
        </Card>

        <Link href="/admin/orders">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 주문</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}건</div>
              <p className="text-xs text-muted-foreground mt-1">전체 주문 수 (클릭하여 관리)</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/products">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 상품</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}개</div>
              <p className="text-xs text-muted-foreground mt-1">등록된 상품 수 (클릭하여 관리)</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/coupons">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">쿠폰 관리</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">관리</div>
              <p className="text-xs text-muted-foreground mt-1">쿠폰 목록 및 생성 (클릭하여 관리)</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 링크</CardTitle>
          <CardDescription>자주 사용하는 관리 기능</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                주문 관리
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                상품 관리
              </Button>
            </Link>
            <Link href="/admin/coupons">
              <Button variant="outline" className="w-full justify-start">
                <Ticket className="h-4 w-4 mr-2" />
                쿠폰 관리
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
