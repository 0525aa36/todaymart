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

interface TopProduct {
  productId: number
  productName: string
  totalSold: number
  revenue: number
  imageUrl: string
}

interface DashboardStats {
  totalSales: number
  todaySales: number
  monthSales: number
  salesGrowthRate: number
  totalOrders: number
  todayOrders: number
  monthOrders: number
  pendingOrders: number
  ordersGrowthRate: number
  totalUsers: number
  todayNewUsers: number
  usersGrowthRate: number
  lowStockCount: number
  topProducts: TopProduct[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

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
      const data = await apiFetch<DashboardStats>("/api/admin/dashboard/stats", { auth: true })
      setStats(data)
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

  const GrowthRate = ({ rate }: { rate?: number }) => {
    if (rate === undefined || rate === null) return null
    const isPositive = rate >= 0
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`h-4 w-4 mr-1 ${isPositive ? '' : 'rotate-180'}`} />
        <span className="font-medium">{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
        {/* 이번 달 매출 */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
                <DollarSign className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <GrowthRate rate={stats.salesGrowthRate} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.monthSales.toLocaleString()}원
            </div>
            <p className="text-sm text-gray-500">이번 달 매출</p>
          </CardContent>
        </Card>

        {/* 이번 달 주문 */}
        <Link href="/admin/orders">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <ShoppingCart className="h-6 w-6" style={{ color: '#7C3AED' }} />
                </div>
                <GrowthRate rate={stats.ordersGrowthRate} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.monthOrders}건
              </div>
              <p className="text-sm text-gray-500">이번 달 주문</p>
            </CardContent>
          </Card>
        </Link>

        {/* 이번 달 신규 회원 */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
                <Users className="h-6 w-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <GrowthRate rate={stats.usersGrowthRate} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.todayNewUsers}명
            </div>
            <p className="text-sm text-gray-500">오늘 신규 회원</p>
          </CardContent>
        </Card>

        {/* 재고 부족 */}
        <Link href="/admin/inventory">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF3E0' }}>
                  <Package className="h-6 w-6" style={{ color: 'var(--color-warning)' }} />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.lowStockCount}개
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

        {/* 인기 상품 Top 5 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">인기 상품 Top 5</CardTitle>
            <CardDescription className="text-sm">이번 달 판매량 기준</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                판매 내역이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <Link
                    key={product.productId}
                    href={`/product/${product.productId}`}
                    className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                         style={{
                           backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--color-primary-50)',
                           color: index < 3 ? 'white' : 'var(--color-primary)'
                         }}>
                      {index + 1}
                    </div>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        판매량: {product.totalSold}개
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {product.revenue.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">매출</p>
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
