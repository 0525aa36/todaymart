"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Search, Truck, Package2, Edit } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
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
  user: {
    id: number
    name: string
    email: string
  }
  recipientName: string
  recipientPhone: string
  shippingAddressLine1: string
  shippingAddressLine2: string
  shippingPostcode: string
  trackingNumber?: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [updating, setUpdating] = useState(false)

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

    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<{ content?: Order[] }>("/api/admin/orders?size=100", { auth: true })
      setOrders(data.content || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "주문 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUpdating(true)
    try {
      await apiFetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ status: newStatus }),
        parseResponse: "none",
      })

      toast({
        title: "상태 변경 완료",
        description: "주문 상태가 변경되었습니다.",
      })
      setStatusDialogOpen(false)
      fetchOrders()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "상태 변경 실패",
        description: getErrorMessage(error, "상태 변경 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUpdating(true)
    try {
      await apiFetch(`/api/admin/orders/${selectedOrder.id}/tracking`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
        parseResponse: "none",
      })

      toast({
        title: "송장번호 등록 완료",
        description: "송장번호가 등록되었습니다.",
      })
      setTrackingDialogOpen(false)
      setTrackingNumber("")
      fetchOrders()
    } catch (error) {
      console.error("Error updating tracking:", error)
      toast({
        title: "송장번호 등록 실패",
        description: getErrorMessage(error, "송장번호 등록 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.orderStatus)
    setStatusDialogOpen(true)
  }

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order)
    setTrackingNumber(order.trackingNumber || "")
    setTrackingDialogOpen(true)
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (selectedStatus !== "ALL" && order.orderStatus !== selectedStatus) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.id.toString().includes(query) ||
        order.user.name.toLowerCase().includes(query) ||
        order.recipientName.toLowerCase().includes(query) ||
        order.orderItems.some((item) => item.product.name.toLowerCase().includes(query))
      )
    }

    return true
  })

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
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/admin">
                <ChevronLeft className="h-4 w-4 mr-2" />
                대시보드로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">주문 관리</h1>
            <p className="text-muted-foreground">총 {orders.length}건의 주문</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex-1">
                  <Label htmlFor="status-filter">주문 상태</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      <SelectItem value="PENDING">결제대기</SelectItem>
                      <SelectItem value="PAID">결제완료</SelectItem>
                      <SelectItem value="SHIPPED">배송중</SelectItem>
                      <SelectItem value="DELIVERED">배송완료</SelectItem>
                      <SelectItem value="CANCELLED">주문취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="flex-1">
                  <Label htmlFor="search">검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="주문번호, 고객명, 상품명..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>주문 목록 ({filteredOrders.length}건)</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">주문이 없습니다</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>주문번호</TableHead>
                        <TableHead>주문일시</TableHead>
                        <TableHead>고객명</TableHead>
                        <TableHead>상품</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>송장번호</TableHead>
                        <TableHead>관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.user.name}</p>
                              <p className="text-xs text-muted-foreground">{order.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate">{order.orderItems[0]?.product.name}</p>
                              {order.orderItems.length > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  외 {order.orderItems.length - 1}개
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{order.totalAmount.toLocaleString()}원</TableCell>
                          <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                          <TableCell>
                            {order.trackingNumber ? (
                              <span className="text-sm">{order.trackingNumber}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openStatusDialog(order)}
                                title="상태 변경"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {order.orderStatus === "PAID" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTrackingDialog(order)}
                                  title="송장번호 등록"
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 상태 변경</DialogTitle>
            <DialogDescription>주문번호: #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-status">새로운 상태</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">결제대기</SelectItem>
                  <SelectItem value="PAID">결제완료</SelectItem>
                  <SelectItem value="SHIPPED">배송중</SelectItem>
                  <SelectItem value="DELIVERED">배송완료</SelectItem>
                  <SelectItem value="CANCELLED">주문취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={updating}>
              취소
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Number Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>송장번호 등록</DialogTitle>
            <DialogDescription>주문번호: #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tracking-number">송장번호</Label>
              <Input
                id="tracking-number"
                placeholder="송장번호를 입력하세요"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>배송지: {selectedOrder?.shippingAddressLine1}</p>
              <p>수령인: {selectedOrder?.recipientName}</p>
              <p>연락처: {selectedOrder?.recipientPhone}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)} disabled={updating}>
              취소
            </Button>
            <Button onClick={handleUpdateTracking} disabled={updating || !trackingNumber.trim()}>
              {updating ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
