"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { RotateCcw, Search, Filter, CheckCircle, XCircle, Package } from "lucide-react"
import { AdminReturnDialog } from "@/components/returns/admin-return-dialog"

interface ReturnItem {
  id: number
  orderItem: {
    id: number
    product: {
      name: string
    }
    quantity: number
  }
  quantity: number
  refundAmount: number
}

interface ReturnRequest {
  id: number
  order: {
    id: number
    orderNumber: string
    user: {
      name: string
      email: string
    }
  }
  status: string
  reasonCategory: string
  detailedReason: string
  totalRefundAmount: number
  itemsRefundAmount: number
  shippingRefundAmount: number
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  completedAt?: string
  adminNote?: string
  returnItems: ReturnItem[]
}

interface Stats {
  pendingCount: number
}

export default function AdminReturnsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [stats, setStats] = useState<Stats>({ pendingCount: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"detail" | "approve" | "reject" | "complete">("detail")

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [reasonFilter, setReasonFilter] = useState<string>("all")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchReturns()
    fetchStats()
    setCurrentPage(0) // Reset to first page when filters change
  }, [statusFilter, reasonFilter, searchKeyword])

  const fetchReturns = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (reasonFilter !== "all") params.append("reasonCategory", reasonFilter)
      if (searchKeyword) params.append("keyword", searchKeyword)

      const url = `/api/admin/returns/filter?${params.toString()}`
      const data = await apiFetch<{ content: ReturnRequest[] }>(url, { auth: true })
      setReturns(data.content)
    } catch (error) {
      console.error("Error fetching returns:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "반품 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await apiFetch<Stats>("/api/admin/returns/stats", { auth: true })
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const openDialog = (returnRequest: ReturnRequest, mode: typeof dialogMode) => {
    setSelectedReturn(returnRequest)
    setDialogMode(mode)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchReturns()
    fetchStats()
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      REQUESTED: "요청됨",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
      COMPLETED: "완료됨",
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      REQUESTED: "bg-yellow-500",
      APPROVED: "bg-blue-500",
      REJECTED: "bg-red-500",
      COMPLETED: "bg-green-500",
    }
    return colorMap[status] || "bg-gray-500"
  }

  const getReasonCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      DEFECTIVE_PRODUCT: "상품 불량",
      WRONG_DELIVERY: "오배송",
      PRODUCT_INFO_MISMATCH: "상품 정보 상이",
      DELIVERY_DELAY: "배송 지연",
      SIMPLE_CHANGE_OF_MIND: "단순 변심",
      SIZE_COLOR_MISMATCH: "사이즈/색상 불만",
      OTHER: "기타",
    }
    return categoryMap[category] || category
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

  // Pagination
  const totalPages = Math.ceil(returns.length / itemsPerPage)
  const paginatedReturns = returns.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-center">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <main className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">반품 관리</h1>
                <p className="text-muted-foreground mt-1">반품 요청을 승인/거부하고 관리합니다</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">대기 중</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">상태</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="REQUESTED">요청됨</SelectItem>
                      <SelectItem value="APPROVED">승인됨</SelectItem>
                      <SelectItem value="REJECTED">거부됨</SelectItem>
                      <SelectItem value="COMPLETED">완료됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">사유</label>
                  <Select value={reasonFilter} onValueChange={setReasonFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="DEFECTIVE_PRODUCT">상품 불량</SelectItem>
                      <SelectItem value="WRONG_DELIVERY">오배송</SelectItem>
                      <SelectItem value="PRODUCT_INFO_MISMATCH">상품 정보 상이</SelectItem>
                      <SelectItem value="DELIVERY_DELAY">배송 지연</SelectItem>
                      <SelectItem value="SIMPLE_CHANGE_OF_MIND">단순 변심</SelectItem>
                      <SelectItem value="SIZE_COLOR_MISMATCH">사이즈/색상 불만</SelectItem>
                      <SelectItem value="OTHER">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">검색</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="주문번호, 고객명으로 검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Returns Table */}
          <Card>
            <CardContent className="p-0">
              {returns.length === 0 ? (
                <div className="text-center py-12">
                  <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">반품 요청이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">번호</TableHead>
                        <TableHead className="w-[100px]">상태</TableHead>
                        <TableHead className="w-[120px]">주문번호</TableHead>
                        <TableHead className="w-[100px]">고객명</TableHead>
                        <TableHead className="w-[150px]">반품사유</TableHead>
                        <TableHead className="w-[250px]">상세사유</TableHead>
                        <TableHead className="w-[120px]">환불금액</TableHead>
                        <TableHead className="w-[150px]">요청날짜</TableHead>
                        <TableHead className="w-[200px] text-center">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReturns.map((returnRequest) => (
                        <TableRow
                          key={returnRequest.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => openDialog(returnRequest, "detail")}
                        >
                          <TableCell className="font-medium">#{returnRequest.id}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(returnRequest.status)}>
                              {getStatusLabel(returnRequest.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{returnRequest.order.orderNumber}</TableCell>
                          <TableCell>{returnRequest.order.user.name}</TableCell>
                          <TableCell>{getReasonCategoryLabel(returnRequest.reasonCategory)}</TableCell>
                          <TableCell>
                            <div className="max-w-[250px] truncate" title={returnRequest.detailedReason}>
                              {returnRequest.detailedReason}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {returnRequest.totalRefundAmount.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(returnRequest.requestedAt)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-center">
                              {returnRequest.status === "REQUESTED" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => openDialog(returnRequest, "approve")}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    승인
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => openDialog(returnRequest, "reject")}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    거부
                                  </Button>
                                </>
                              )}
                              {returnRequest.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => openDialog(returnRequest, "complete")}
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  완료
                                </Button>
                              )}
                              {returnRequest.status === "COMPLETED" || returnRequest.status === "REJECTED" ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : null}
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
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    이전
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Admin Return Dialog */}
      {selectedReturn && (
        <AdminReturnDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          returnRequest={selectedReturn}
          mode={dialogMode}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
