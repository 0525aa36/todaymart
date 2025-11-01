"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Search } from "lucide-react"

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    imageUrl: string
  }
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
}

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, selectedStatus, searchQuery])

  const fetchOrders = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch("http://localhost:8081/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        throw new Error("Failed to fetch orders")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "오류",
        description: "주문 내역을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((order) => order.orderStatus === selectedStatus)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchQuery) ||
          order.orderItems.some((item) => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredOrders(filtered)
  }

  const getOrderStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "결제대기",
      PAID: "결제완료",
      SHIPPED: "배송중",
      DELIVERED: "배송완료",
      CANCELLED: "취소됨",
    }
    return statusMap[status] || status
  }

  const getOrderStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "bg-muted",
      PAID: "bg-primary",
      SHIPPED: "bg-blue-500",
      DELIVERED: "bg-secondary",
      CANCELLED: "bg-destructive",
    }
    return colorMap[status] || "bg-muted"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const statusFilters = [
    { value: "ALL", label: "전체", count: orders.length },
    { value: "PAID", label: "결제완료", count: orders.filter((o) => o.orderStatus === "PAID").length },
    { value: "SHIPPED", label: "배송중", count: orders.filter((o) => o.orderStatus === "SHIPPED").length },
    { value: "DELIVERED", label: "배송완료", count: orders.filter((o) => o.orderStatus === "DELIVERED").length },
    { value: "CANCELLED", label: "취소됨", count: orders.filter((o) => o.orderStatus === "CANCELLED").length },
  ]

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">주문 내역</h1>
            <p className="text-muted-foreground">총 {orders.length}건의 주문</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={selectedStatus === filter.value ? "default" : "outline"}
                      onClick={() => setSelectedStatus(filter.value)}
                      className="flex-1 min-w-[100px]"
                    >
                      {filter.label}
                      <Badge variant="secondary" className="ml-2">
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="주문번호 또는 상품명으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {searchQuery
                    ? "검색 결과가 없습니다."
                    : selectedStatus === "ALL"
                    ? "주문 내역이 없습니다."
                    : `${getOrderStatusLabel(selectedStatus)} 주문이 없습니다.`}
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{formatDate(order.createdAt)}</div>
                        <CardTitle className="text-lg">주문번호: #{order.id}</CardTitle>
                      </div>
                      <Badge className={getOrderStatusColor(order.orderStatus)}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      {order.orderItems.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={item.product.imageUrl || "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">수량: {item.quantity}개</p>
                            <p className="font-semibold">{(item.price * item.quantity).toLocaleString()}원</p>
                          </div>
                        </div>
                      ))}

                      {order.orderItems.length > 2 && (
                        <p className="text-sm text-muted-foreground">외 {order.orderItems.length - 2}개 상품</p>
                      )}

                      <Separator />

                      {/* Total Amount */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">총 결제금액</span>
                        <span className="text-xl font-bold text-primary">{order.totalAmount.toLocaleString()}원</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 bg-transparent" asChild>
                          <Link href={`/mypage/orders/${order.id}`}>주문 상세</Link>
                        </Button>
                        {order.orderStatus === "DELIVERED" && (
                          <Button variant="outline" className="flex-1 bg-transparent">
                            리뷰 작성
                          </Button>
                        )}
                        {order.orderStatus === "PAID" && (
                          <Button variant="outline" className="flex-1 bg-transparent">
                            배송 조회
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Empty State for No Orders */}
          {orders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">아직 주문 내역이 없습니다.</p>
                <Button asChild>
                  <Link href="/">쇼핑 시작하기</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
