"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

interface Seller {
  id: number
  name: string
  businessNumber: string
  commissionRate: number
}

interface Settlement {
  id: number
  seller: Seller
  startDate: string
  endDate: string
  totalSales: number
  commissionAmount: number
  netAmount: number
  status: "PENDING" | "APPROVED" | "PAID" | "CANCELLED"
  paymentDate?: string
  paymentMethod?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

export default function AdminSettlementsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [sellerFilter, setSellerFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Generate dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generateData, setGenerateData] = useState({
    sellerId: "",
    startDate: "",
    endDate: "",
  })

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)

  // Pay dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payData, setPayData] = useState({
    paymentMethod: "",
    paymentDate: "",
  })

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
    fetchSettlements()
  }, [sellerFilter, statusFilter])

  const fetchSellers = async () => {
    try {
      const data = await apiFetch<Seller[]>("/api/admin/sellers/active", {
        auth: true,
      })
      setSellers(data)
    } catch (error) {
      console.error("Error fetching sellers:", error)
    }
  }

  const fetchSettlements = async () => {
    try {
      let url = "/api/admin/settlements?size=100&sort=createdAt,desc"
      if (sellerFilter) {
        url += `&sellerId=${sellerFilter}`
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`
      }

      const data = await apiFetch<{ content?: Settlement[] }>(url, {
        auth: true,
      })
      setSettlements(data.content || [])
    } catch (error) {
      console.error("Error fetching settlements:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "정산 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      const { sellerId, startDate, endDate } = generateData

      if (!startDate || !endDate) {
        toast({
          title: "입력 오류",
          description: "시작일과 종료일을 모두 입력해주세요.",
          variant: "destructive",
        })
        return
      }

      const url = sellerId
        ? `/api/admin/settlements/generate/${sellerId}?startDate=${startDate}&endDate=${endDate}`
        : `/api/admin/settlements/generate?startDate=${startDate}&endDate=${endDate}`

      await apiFetch(url, {
        method: "POST",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "정산 생성 완료",
        description: sellerId ? "선택한 판매자의 정산이 생성되었습니다." : "모든 활성 판매자의 정산이 생성되었습니다.",
      })
      setGenerateDialogOpen(false)
      setGenerateData({ sellerId: "", startDate: "", endDate: "" })
      fetchSettlements()
    } catch (error) {
      console.error("Error generating settlements:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "정산 생성 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleApprove = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setApproveDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedSettlement) return

    try {
      await apiFetch(`/api/admin/settlements/${selectedSettlement.id}/approve`, {
        method: "PUT",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "정산 승인 완료",
        description: `${selectedSettlement.seller.name}의 정산이 승인되었습니다.`,
      })
      setApproveDialogOpen(false)
      fetchSettlements()
    } catch (error) {
      console.error("Error approving settlement:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "정산 승인 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handlePay = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setPayData({
      paymentMethod: "",
      paymentDate: new Date().toISOString().split("T")[0],
    })
    setPayDialogOpen(true)
  }

  const confirmPay = async () => {
    if (!selectedSettlement) return

    try {
      await apiFetch(`/api/admin/settlements/${selectedSettlement.id}/pay`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(payData),
        parseResponse: "none",
      })

      toast({
        title: "지급 완료",
        description: `${selectedSettlement.seller.name}에게 정산금이 지급되었습니다.`,
      })
      setPayDialogOpen(false)
      fetchSettlements()
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "지급 처리 중 오류가 발생했습니다."),
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("ko-KR") + "원"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Calendar className="h-3 w-3 mr-1" />
            대기
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            승인
          </Badge>
        )
      case "PAID":
        return (
          <Badge className="bg-green-600">
            <DollarSign className="h-3 w-3 mr-1" />
            지급완료
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            취소
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">정산 관리</h1>
                <p className="text-sm text-gray-500 mt-1">판매자별 정산 내역을 관리하세요</p>
              </div>
              <Button onClick={() => setGenerateDialogOpen(true)}>
                <DollarSign className="h-4 w-4 mr-2" />
                정산 생성
              </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <select
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체 판매자</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name} ({seller.businessNumber})
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체 상태</option>
                  <option value="PENDING">대기</option>
                  <option value="APPROVED">승인</option>
                  <option value="PAID">지급완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
            </div>
          </CardContent>
        </Card>

        {/* Settlements Table */}
        <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-gray-900">정산 내역 ({settlements.length}건)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  정산 내역이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>판매자</TableHead>
                      <TableHead>정산 기간</TableHead>
                      <TableHead className="text-right">총 매출</TableHead>
                      <TableHead className="text-right">수수료</TableHead>
                      <TableHead className="text-right">정산 금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">{settlement.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{settlement.seller.name}</div>
                            <div className="text-xs text-muted-foreground">
                              수수료율: {settlement.seller.commissionRate}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(settlement.startDate)} ~<br />
                            {formatDate(settlement.endDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(settlement.totalSales)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(settlement.commissionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(settlement.netAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                        <TableCell>{formatDate(settlement.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {settlement.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(settlement)}
                              >
                                승인
                              </Button>
                            )}
                            {settlement.status === "APPROVED" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handlePay(settlement)}
                              >
                                지급
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Settlement Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 생성</DialogTitle>
            <DialogDescription>
              특정 기간의 정산을 생성합니다. 판매자를 선택하지 않으면 모든 활성 판매자의 정산이 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seller">판매자 (선택사항)</Label>
              <select
                id="seller"
                value={generateData.sellerId}
                onChange={(e) =>
                  setGenerateData({ ...generateData, sellerId: e.target.value })
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">전체 활성 판매자</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} ({seller.businessNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={generateData.startDate}
                onChange={(e) =>
                  setGenerateData({ ...generateData, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={generateData.endDate}
                onChange={(e) =>
                  setGenerateData({ ...generateData, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleGenerate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 승인 확인</DialogTitle>
            <DialogDescription>
              정말로 이 정산을 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">판매자:</span>
                  <span className="font-medium">{selectedSettlement.seller.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">정산 기간:</span>
                  <span className="font-medium">
                    {formatDate(selectedSettlement.startDate)} ~ {formatDate(selectedSettlement.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">총 매출:</span>
                  <span className="font-medium">{formatCurrency(selectedSettlement.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">수수료:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(selectedSettlement.commissionAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">정산 금액:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedSettlement.netAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmApprove}>승인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 지급</DialogTitle>
            <DialogDescription>
              지급 정보를 입력하고 정산을 완료하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">지급 방법</Label>
              <Input
                id="paymentMethod"
                placeholder="예: 계좌이체, 현금 등"
                value={payData.paymentMethod}
                onChange={(e) =>
                  setPayData({ ...payData, paymentMethod: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">지급일</Label>
              <Input
                id="paymentDate"
                type="date"
                value={payData.paymentDate}
                onChange={(e) =>
                  setPayData({ ...payData, paymentDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmPay}>지급 완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
