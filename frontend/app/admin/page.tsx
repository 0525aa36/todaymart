"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
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
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Fetch orders (Admin - all orders)
      const ordersResponse = await fetch("http://localhost:8081/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.content || [])
      }

      // Fetch products
      const productsResponse = await fetch("http://localhost:8081/api/products?size=1000")
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.content || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
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

  // Get recent orders (last 10)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Calculate daily sales for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const salesData = last7Days.map((date) => {
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === date.toDateString()
    })
    const daySales = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    return {
      name: date.toLocaleDateString("ko-KR", { weekday: "short" }),
      sales: daySales,
    }
  })

  // Calculate category distribution
  const categoryCount: Record<string, number> = {}
  products.forEach((product) => {
    categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
  })

  const categoryData = Object.entries(categoryCount).map(([name, value], index) => {
    const colors = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"]
    return {
      name,
      value,
      color: colors[index % colors.length],
    }
  })

  // Calculate top products by order frequency
  const productSales: Record<number, { product: Product; count: number; revenue: number }> = {}
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (!productSales[item.product.id]) {
        productSales[item.product.id] = { product: item.product, count: 0, revenue: 0 }
      }
      productSales[item.product.id].count += item.quantity
      productSales[item.product.id].revenue += item.price * item.quantity
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SHIPPED":
        return <Badge className="bg-blue-500">배송중</Badge>
      case "PAID":
        return <Badge className="bg-green-500">결제완료</Badge>
      case "DELIVERED":
        return <Badge variant="secondary">배송완료</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">주문취소</Badge>
      case "PENDING":
        return <Badge className="bg-muted">결제대기</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleExportExcel = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch("http://localhost:8081/api/admin/orders/export", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "다운로드 완료",
          description: "주문 내역이 엑셀 파일로 다운로드되었습니다.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Error exporting excel:", error)
      toast({
        title: "오류",
        description: "엑셀 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
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

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">농수산물 쇼핑몰 관리</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 주문액</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalOrders > 0 ? Math.round(totalSales / totalOrders).toLocaleString() : 0}원
                </div>
                <p className="text-xs text-muted-foreground mt-1">주문당 평균 금액</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 상품</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}개</div>
                <p className="text-xs text-muted-foreground mt-1">등록된 상품 수</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>주간 매출 현황</CardTitle>
                <CardDescription>최근 7일간의 일별 매출</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                    <Bar dataKey="sales" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>카테고리별 상품 분포</CardTitle>
                <CardDescription>등록된 상품의 카테고리별 비중</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">카테고리 데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">최근 주문</TabsTrigger>
              <TabsTrigger value="products">인기 상품</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>최근 주문 내역</CardTitle>
                      <CardDescription>최근 주문을 확인하고 관리하세요</CardDescription>
                    </div>
                    <Button onClick={handleExportExcel}>
                      <Download className="h-4 w-4 mr-2" />
                      엑셀 다운로드
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">주문 내역이 없습니다</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문번호</TableHead>
                          <TableHead>고객명</TableHead>
                          <TableHead>상품</TableHead>
                          <TableHead>금액</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>주문일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{order.user.name}</TableCell>
                            <TableCell>
                              {order.orderItems[0]?.product.name}
                              {order.orderItems.length > 1 && ` 외 ${order.orderItems.length - 1}개`}
                            </TableCell>
                            <TableCell>{order.totalAmount.toLocaleString()}원</TableCell>
                            <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>인기 상품 TOP 5</CardTitle>
                  <CardDescription>판매량이 높은 상품 순위</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">판매 데이터가 없습니다</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>순위</TableHead>
                          <TableHead>상품명</TableHead>
                          <TableHead>판매량</TableHead>
                          <TableHead>매출액</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((item, index) => (
                          <TableRow key={item.product.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.count}개</TableCell>
                            <TableCell>{item.revenue.toLocaleString()}원</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
