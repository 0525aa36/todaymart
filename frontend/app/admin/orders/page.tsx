"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { OrderStatusBadge } from "@/components/order-status-badge"
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
import { ChevronLeft, Search, Truck, Package2, Edit, RefreshCw, CheckSquare, CheckCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { COURIER_COMPANIES, getCourierCodeByName } from "@/lib/courier-companies"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { AdminLoadingSpinner } from "@/components/admin/AdminLoadingSpinner"
import { LoadingButton } from "@/components/admin/LoadingButton"
import { SortableTableHead, SortDirection } from "@/components/ui/sortable-table-head"
import { Download } from "lucide-react"

interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  sellerId: number | null
  sellerName: string | null
}

interface Order {
  orderId: number
  orderNumber: string
  createdAt: string
  totalAmount: number
  orderStatus: string
  orderItems: OrderItem[]
  customer: {
    userId: number
    name: string
    email: string
  }
  recipientName: string
  recipientPhone: string
  shippingAddressLine1: string
  shippingAddressLine2: string
  shippingPostcode: string
  trackingNumber?: string
  courierCode?: string
  courierCompany?: string
  cancellationReason?: string
}

interface Seller {
  id: number
  name: string
  contactPerson: string
  email: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [selectedSellerId, setSelectedSellerId] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Selection states
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set())
  const [isAllFilterSelected, setIsAllFilterSelected] = useState(false)

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [bulkNewStatus, setBulkNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [courierCode, setCourierCode] = useState("")
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncingPaymentOrderId, setSyncingPaymentOrderId] = useState<number | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [googleSheetsEnabled, setGoogleSheetsEnabled] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [exportingExcel, setExportingExcel] = useState(false)

  // Sorting states
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [itemsPerPage] = useState(10)

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

    fetchSellers()
    fetchOrders()
    checkGoogleSheetsEnabled()
  }, [])

  useEffect(() => {
    fetchOrders()
    clearSelection()
  }, [selectedStatus, selectedSellerId])

  const clearSelection = () => {
    setSelectedOrderIds(new Set())
    setIsAllFilterSelected(false)
  }

  const fetchSellers = async () => {
    try {
      const data = await apiFetch<Seller[]>("/api/admin/orders/sellers", { auth: true })
      setSellers(data || [])
    } catch (error) {
      console.error("Error fetching sellers:", error)
    }
  }

  const fetchOrders = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      let url = "/api/admin/orders?size=100&sort=id,asc"
      if (selectedStatus !== "ALL") {
        url += `&orderStatus=${selectedStatus}`
      }
      if (selectedSellerId !== "ALL") {
        url += `&sellerId=${selectedSellerId}`
      }

      const data = await apiFetch<{ content?: Order[] }>(url, { auth: true })
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

  const fetchAllFilteredOrderIds = async () => {
    try {
      let url = "/api/admin/orders/ids?"
      if (selectedStatus !== "ALL") {
        url += `orderStatus=${selectedStatus}&`
      }
      if (selectedSellerId !== "ALL") {
        url += `sellerId=${selectedSellerId}&`
      }

      const ids = await apiFetch<number[]>(url, { auth: true })
      return ids
    } catch (error) {
      console.error("Error fetching filtered order IDs:", error)
      toast({
        title: "오류",
        description: "필터 결과 조회 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      return []
    }
  }

  const handleSelectAll = () => {
    if (paginatedOrders.every(order => selectedOrderIds.has(order.orderId))) {
      // Deselect all on current page
      const newSelected = new Set(selectedOrderIds)
      paginatedOrders.forEach(order => newSelected.delete(order.orderId))
      setSelectedOrderIds(newSelected)
      setIsAllFilterSelected(false)
    } else {
      // Select all on current page
      const newSelected = new Set(selectedOrderIds)
      paginatedOrders.forEach(order => newSelected.add(order.orderId))
      setSelectedOrderIds(newSelected)
    }
  }

  const handleSelectAllFiltered = async () => {
    const allIds = await fetchAllFilteredOrderIds()
    setSelectedOrderIds(new Set(allIds))
    setIsAllFilterSelected(true)
  }

  const handleToggleOrder = (orderId: number) => {
    const newSelected = new Set(selectedOrderIds)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
      setIsAllFilterSelected(false)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrderIds(newSelected)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUpdating(true)
    try {
      await apiFetch(`/api/admin/orders/${selectedOrder.orderId}/status`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ status: newStatus }),
        parseResponse: "json",
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

  const handleBulkUpdateStatus = async () => {
    if (selectedOrderIds.size === 0 || !bulkNewStatus) return

    setUpdating(true)
    try {
      const result = await apiFetch<any>(`/api/admin/orders/bulk-status`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          orderIds: Array.from(selectedOrderIds),
          status: bulkNewStatus,
        }),
        parseResponse: "json",
      })

      const successCount = result.successCount || 0
      const failureCount = result.failureCount || 0

      toast({
        title: "일괄 상태 변경 완료",
        description: `${successCount}개 성공${failureCount > 0 ? `, ${failureCount}개 실패` : ''}`,
        variant: failureCount > 0 ? "destructive" : "default",
      })

      setBulkStatusDialogOpen(false)
      clearSelection()
      fetchOrders()
    } catch (error) {
      console.error("Error bulk updating status:", error)
      toast({
        title: "일괄 상태 변경 실패",
        description: getErrorMessage(error, "일괄 상태 변경 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim() || !courierCode) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUpdating(true)
    try {
      const courier = COURIER_COMPANIES.find(c => c.code === courierCode)
      await apiFetch(`/api/admin/orders/${selectedOrder.orderId}/tracking`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          courierCode: courierCode,
          courierCompany: courier?.name || ""
        }),
        parseResponse: "json",
      })

      toast({
        title: "송장번호 등록 완료",
        description: "송장번호가 등록되었습니다.",
      })
      setTrackingDialogOpen(false)
      setTrackingNumber("")
      setCourierCode("")
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

  const openBulkStatusDialog = () => {
    setBulkNewStatus("")
    setBulkStatusDialogOpen(true)
  }

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order)
    setTrackingNumber(order.trackingNumber || "")
    setCourierCode(order.courierCode || "")
    setTrackingDialogOpen(true)
  }

  const handleConfirmOrder = async (order: Order) => {
    const token = localStorage.getItem("token")
    if (!token) return

    setUpdating(true)
    try {
      await apiFetch(`/api/admin/orders/${order.orderId}/status`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ status: "PREPARING" }),
        parseResponse: "json",
      })

      toast({
        title: "주문 확인 완료",
        description: "상품 준비중 상태로 변경되었습니다.",
      })
      fetchOrders()
    } catch (error) {
      console.error("Error confirming order:", error)
      toast({
        title: "주문 확인 실패",
        description: getErrorMessage(error, "주문 확인 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSyncPaymentStatus = async (order: Order) => {
    setSyncingPaymentOrderId(order.orderId)
    try {
      const result = await apiFetch<{
        action: string
        message: string
        newStatus?: string
        cancelReason?: string
      }>(`/api/admin/orders/${order.orderId}/sync-payment`, {
        method: "POST",
        auth: true,
        parseResponse: "json",
      })

      if (result.action === "cancelled" || result.action === "partial_refund") {
        toast({
          title: "결제 취소 반영됨",
          description: result.message,
        })
        fetchOrders()
      } else if (result.action === "already_cancelled") {
        toast({
          title: "이미 취소됨",
          description: result.message,
        })
      } else {
        toast({
          title: "동기화 완료",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Error syncing payment status:", error)
      toast({
        title: "동기화 실패",
        description: getErrorMessage(error, "결제 상태 동기화 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSyncingPaymentOrderId(null)
    }
  }

  const checkGoogleSheetsEnabled = async () => {
    try {
      const response = await apiFetch<{ success: boolean; data: { lastSyncTime: string | null } }>("/api/admin/sheets/last-sync", { auth: true })
      setGoogleSheetsEnabled(true)
      if (response.data && response.data.lastSyncTime) {
        setLastSyncTime(response.data.lastSyncTime)
      }
    } catch (error) {
      setGoogleSheetsEnabled(false)
      console.log("Google Sheets sync not available")
    }
  }

  const handleSyncToGoogleSheets = async () => {
    setSyncing(true)
    try {
      let url = "/api/admin/sheets/sync-all"
      if (selectedSellerId !== "ALL") {
        url = `/api/admin/sheets/sync/${selectedSellerId}`
      }

      await apiFetch(url, {
        method: "POST",
        auth: true,
        parseResponse: "json",
      })

      toast({
        title: "동기화 완료",
        description: "구글 스프레드시트에 주문 내역이 동기화되었습니다.",
      })

      checkGoogleSheetsEnabled()
    } catch (error) {
      console.error("Error syncing to Google Sheets:", error)
      toast({
        title: "동기화 실패",
        description: getErrorMessage(error, "구글 스프레드시트 동기화 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const params = new URLSearchParams()
      // 판매자 필터가 선택된 경우 추가
      if (selectedSellerId !== "ALL") {
        params.append('sellerId', selectedSellerId)
      }
      // 상태 필터도 추가 (기본값: PREPARING)
      if (selectedStatus !== "ALL") {
        params.append('status', selectedStatus)
      }
      const url = `/api/admin/orders/export${params.toString() ? '?' + params.toString() : ''}`

      const blob = await apiFetch<Blob>(url, {
        auth: true,
        parseResponse: 'blob'
      })

      const downloadUrl = window.URL.createObjectURL(blob as Blob)
      const link = document.createElement('a')
      link.href = downloadUrl

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      // 판매자명을 파일명에 포함
      const sellerName = selectedSellerId !== "ALL"
        ? sellers.find(s => s.id.toString() === selectedSellerId)?.name
        : null
      link.download = sellerName
        ? `orders_${sellerName}_${dateStr}.xlsx`
        : `orders_${dateStr}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "다운로드 완료",
        description: sellerName
          ? `${sellerName} 주문 내역 엑셀 파일이 다운로드되었습니다.`
          : "주문 내역 엑셀 파일이 다운로드되었습니다.",
      })
    } catch (error) {
      console.error("Error exporting Excel:", error)
      toast({
        title: "다운로드 실패",
        description: getErrorMessage(error, "엑셀 파일 다운로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setExportingExcel(false)
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus !== "ALL" && order.orderStatus !== selectedStatus) {
      return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.recipientName.toLowerCase().includes(query) ||
        order.orderItems.some((item) => item.productName.toLowerCase().includes(query))
      )
    }

    return true
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0

    let aValue: any
    let bValue: any

    switch (sortKey) {
      case "orderNumber":
        aValue = a.orderNumber
        bValue = b.orderNumber
        break
      case "createdAt":
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case "customer":
        aValue = a.customer.name
        bValue = b.customer.name
        break
      case "totalAmount":
        aValue = a.totalAmount
        bValue = b.totalAmount
        break
      case "status":
        aValue = a.orderStatus
        bValue = b.orderStatus
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )
  const totalElements = sortedOrders.length

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isAllPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrderIds.has(order.orderId))
  const isSomePageSelected = paginatedOrders.some(order => selectedOrderIds.has(order.orderId)) && !isAllPageSelected

  if (loading) {
    return <AdminLoadingSpinner size="lg" />
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">주문 관리</h1>
            <p className="text-sm text-gray-500 mt-1">총 {orders.length}건의 주문</p>
            {lastSyncTime && (
              <p className="text-xs text-gray-400 mt-1">
                마지막 동기화: {new Date(lastSyncTime).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {selectedOrderIds.size > 0 && (
              <Button onClick={openBulkStatusDialog} className="bg-blue-600 hover:bg-blue-700">
                <CheckSquare className="h-4 w-4 mr-2" />
                선택상품 상태 변경 ({selectedOrderIds.size})
              </Button>
            )}
            <LoadingButton
              onClick={handleExportExcel}
              isLoading={exportingExcel}
              loadingText="다운로드 중..."
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              엑셀 다운로드
              {selectedSellerId !== "ALL" && (
                <span className="ml-1 text-xs text-blue-600">
                  ({sellers.find(s => s.id.toString() === selectedSellerId)?.name})
                </span>
              )}
            </LoadingButton>
            {googleSheetsEnabled && (
              <LoadingButton
                onClick={handleSyncToGoogleSheets}
                isLoading={syncing}
                loadingText="동기화 중..."
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                구글 시트 동기화
              </LoadingButton>
            )}
          </div>
        </div>

        {/* Selection Banner */}
        {selectedOrderIds.size > 0 && !isAllFilterSelected && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-blue-900">
                {selectedOrderIds.size}개 주문 선택됨
              </span>
              <Button
                variant="link"
                onClick={handleSelectAllFiltered}
                className="text-blue-700 hover:text-blue-900 h-auto p-0"
              >
                필터 결과 전체 {filteredOrders.length}개 선택
              </Button>
            </CardContent>
          </Card>
        )}

        {isAllFilterSelected && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                필터 결과 {selectedOrderIds.size}개 모두 선택됨
              </span>
              <Button
                variant="link"
                onClick={clearSelection}
                className="text-blue-700 hover:text-blue-900 h-auto p-0"
              >
                선택 해제
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters - Reduced Height */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status Filter */}
              <div className="space-y-1">
                <Label htmlFor="status-filter" className="text-xs font-medium text-gray-700">주문 상태</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-filter" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="PENDING_PAYMENT">결제 대기</SelectItem>
                    <SelectItem value="PAYMENT_FAILED">결제 실패</SelectItem>
                    <SelectItem value="PAID">결제 완료</SelectItem>
                    <SelectItem value="PREPARING">상품 준비중</SelectItem>
                    <SelectItem value="SHIPPED">배송중</SelectItem>
                    <SelectItem value="DELIVERED">배송 완료</SelectItem>
                    <SelectItem value="CANCELLED">주문 취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seller Filter */}
              <div className="space-y-1">
                <Label htmlFor="seller-filter" className="text-xs font-medium text-gray-700">판매자</Label>
                <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                  <SelectTrigger id="seller-filter" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체 판매자</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id.toString()}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-1">
                <Label htmlFor="search" className="text-xs font-medium text-gray-700">검색</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="주문번호, 고객명, 상품명..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              주문 목록 ({filteredOrders.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">주문이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-gray-50/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllPageSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="전체 선택"
                            className={isSomePageSelected ? "data-[state=checked]:bg-blue-600" : ""}
                          />
                        </TableHead>
                        <SortableTableHead
                          sortKey="orderNumber"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                          className="font-semibold text-gray-700"
                        >
                          주문번호
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="createdAt"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                          className="font-semibold text-gray-700"
                        >
                          주문일시
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="customer"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                          className="font-semibold text-gray-700"
                        >
                          고객명
                        </SortableTableHead>
                        <TableHead className="font-semibold text-gray-700">상품</TableHead>
                        <TableHead className="font-semibold text-gray-700">판매자</TableHead>
                        <SortableTableHead
                          sortKey="totalAmount"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                          className="font-semibold text-gray-700"
                        >
                          금액
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="status"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                          className="font-semibold text-gray-700"
                        >
                          상태
                        </SortableTableHead>
                        <TableHead className="font-semibold text-gray-700">송장번호/취소사유</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order, index) => (
                        <TableRow key={order.orderId ?? order.orderNumber ?? `order-${index}`} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedOrderIds.has(order.orderId)}
                              onCheckedChange={() => handleToggleOrder(order.orderId)}
                              aria-label={`주문 ${order.orderNumber} 선택`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{order.orderNumber}</TableCell>
                          <TableCell className="text-sm text-gray-600">{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{order.customer.name}</p>
                              <p className="text-xs text-gray-500">{order.customer.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-900 truncate">{order.orderItems[0]?.productName}</p>
                              {order.orderItems.length > 1 && (
                                <p className="text-xs text-gray-500">
                                  외 {order.orderItems.length - 1}개
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {order.orderItems[0]?.sellerName || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">{order.totalAmount.toLocaleString()}원</TableCell>
                          <TableCell><OrderStatusBadge status={order.orderStatus} /></TableCell>
                          <TableCell>
                            {order.orderStatus === "CANCELLED" && order.cancellationReason ? (
                              <div className="max-w-xs">
                                <p className="text-xs text-red-600 font-medium">취소 사유:</p>
                                <p className="text-sm text-gray-700 truncate" title={order.cancellationReason}>
                                  {order.cancellationReason}
                                </p>
                              </div>
                            ) : order.trackingNumber ? (
                              <span className="text-sm text-gray-900 font-mono">{order.trackingNumber}</span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openStatusDialog(order)}
                                title="상태 변경"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {order.orderStatus === "PAID" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmOrder(order)}
                                    title="주문 확인 (상품 준비중으로 변경)"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSyncPaymentStatus(order)}
                                    disabled={syncingPaymentOrderId === order.orderId}
                                    title="토스 결제 상태 동기화 (취소 여부 확인)"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  >
                                    <RotateCcw className={`h-4 w-4 ${syncingPaymentOrderId === order.orderId ? 'animate-spin' : ''}`} />
                                  </Button>
                                </>
                              )}
                              {order.orderStatus === "PREPARING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTrackingDialog(order)}
                                  title="송장번호 등록"
                                  className="h-8 w-8 p-0"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 상태 변경</DialogTitle>
            <DialogDescription>주문번호: {selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-status">새로운 상태</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_PAYMENT">결제 대기</SelectItem>
                  <SelectItem value="PAYMENT_FAILED">결제 실패</SelectItem>
                  <SelectItem value="PAID">결제 완료</SelectItem>
                  <SelectItem value="PREPARING">상품 준비중</SelectItem>
                  <SelectItem value="SHIPPED">배송중</SelectItem>
                  <SelectItem value="DELIVERED">배송 완료</SelectItem>
                  <SelectItem value="CANCELLED">주문 취소</SelectItem>
                  <SelectItem value="RETURN_REQUESTED">반품 요청</SelectItem>
                  <SelectItem value="RETURN_APPROVED">반품 승인</SelectItem>
                  <SelectItem value="RETURN_COMPLETED">반품 완료</SelectItem>
                  <SelectItem value="PARTIALLY_RETURNED">부분 반품 완료</SelectItem>
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

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선택 주문 일괄 상태 변경</DialogTitle>
            <DialogDescription>
              {selectedOrderIds.size}개 주문의 상태를 일괄 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-new-status">새로운 상태</Label>
              <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
                <SelectTrigger id="bulk-new-status">
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_PAYMENT">결제 대기</SelectItem>
                  <SelectItem value="PAYMENT_FAILED">결제 실패</SelectItem>
                  <SelectItem value="PAID">결제 완료</SelectItem>
                  <SelectItem value="PREPARING">상품 준비중</SelectItem>
                  <SelectItem value="SHIPPED">배송중</SelectItem>
                  <SelectItem value="DELIVERED">배송 완료</SelectItem>
                  <SelectItem value="CANCELLED">주문 취소</SelectItem>
                  <SelectItem value="RETURN_REQUESTED">반품 요청</SelectItem>
                  <SelectItem value="RETURN_APPROVED">반품 승인</SelectItem>
                  <SelectItem value="RETURN_COMPLETED">반품 완료</SelectItem>
                  <SelectItem value="PARTIALLY_RETURNED">부분 반품 완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="font-medium text-amber-900 mb-1">주의사항</p>
              <p className="text-amber-800">선택된 {selectedOrderIds.size}개 주문의 상태가 모두 변경됩니다. 일부 주문은 실패할 수 있습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)} disabled={updating}>
              취소
            </Button>
            <Button onClick={handleBulkUpdateStatus} disabled={updating || !bulkNewStatus}>
              {updating ? "변경 중..." : `${selectedOrderIds.size}개 주문 상태 변경`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Number Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>송장번호 등록</DialogTitle>
            <DialogDescription>주문번호: {selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courier-company">택배사</Label>
              <Select value={courierCode} onValueChange={setCourierCode}>
                <SelectTrigger id="courier-company">
                  <SelectValue placeholder="택배사를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {COURIER_COMPANIES.map((courier) => (
                    <SelectItem key={courier.code} value={courier.code}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleUpdateTracking} disabled={updating || !trackingNumber.trim() || !courierCode}>
              {updating ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
