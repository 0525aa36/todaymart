"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, RotateCcw } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

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
    orderNumber?: string
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

export default function MyReturnsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    try {
      const data = await apiFetch<ReturnRequest[]>("/api/returns/my", { auth: true })
      setReturns(data)
    } catch (error) {
      console.error("Error fetching returns:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "반품 내역을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReturn = async (returnId: number) => {
    if (!confirm("반품 요청을 취소하시겠습니까?")) return

    try {
      await apiFetch(`/api/returns/${returnId}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "취소 완료",
        description: "반품 요청이 취소되었습니다.",
      })
      fetchReturns()
    } catch (error) {
      console.error("Error cancelling return:", error)
      toast({
        title: "취소 실패",
        description: getErrorMessage(error, "반품 요청 취소 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
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
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">반품 내역</h1>
                <p className="text-muted-foreground mt-1">총 {returns.length}건의 반품 요청</p>
              </div>
            </div>
          </div>

          {/* Returns List */}
          {returns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">반품 내역이 없습니다</p>
                <p className="text-muted-foreground mb-6">배송 완료된 주문에서 반품을 신청할 수 있습니다</p>
                <Button asChild>
                  <Link href="/mypage/orders">주문 내역 보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {returns.map((returnRequest) => (
                <Card key={returnRequest.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        반품 요청 #{returnRequest.id}
                      </CardTitle>
                      <Badge className={getStatusColor(returnRequest.status)}>
                        {getStatusLabel(returnRequest.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Return Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">요청 날짜</span>
                        <p className="font-medium mt-1">{formatDate(returnRequest.requestedAt)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">주문 번호</span>
                        <p className="font-medium mt-1">
                          <Link
                            href={`/mypage/orders/${returnRequest.order.id}`}
                            className="text-primary hover:underline"
                          >
                            #{returnRequest.order.id}
                          </Link>
                        </p>
                      </div>
                    </div>

                    {/* Return Items */}
                    <div>
                      <span className="text-sm text-muted-foreground">반품 상품</span>
                      <div className="mt-2 space-y-2">
                        {returnRequest.returnItems.map((item) => (
                          <div key={item.id} className="text-sm">
                            <span className="font-medium">{item.orderItem.product.name}</span>
                            <span className="text-muted-foreground ml-2">
                              (수량: {item.quantity}개)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Return Reason */}
                    <div>
                      <span className="text-sm text-muted-foreground">반품 사유</span>
                      <p className="font-medium mt-1">{getReasonCategoryLabel(returnRequest.reasonCategory)}</p>
                      <p className="text-sm text-muted-foreground mt-1">{returnRequest.detailedReason}</p>
                    </div>

                    {/* Admin Note (if rejected or completed) */}
                    {returnRequest.adminNote && (
                      <div className="bg-muted p-3 rounded">
                        <span className="text-sm font-medium">관리자 메모</span>
                        <p className="text-sm mt-1">{returnRequest.adminNote}</p>
                      </div>
                    )}

                    {/* Refund Info */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">상품 금액</span>
                        <span>{returnRequest.itemsRefundAmount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">배송비</span>
                        <span>{returnRequest.shippingRefundAmount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">총 환불 금액</span>
                        <span className="text-lg font-bold text-primary">
                          {returnRequest.totalRefundAmount.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {returnRequest.status === "REQUESTED" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelReturn(returnRequest.id)}
                        >
                          요청 취소
                        </Button>
                      </div>
                    )}

                    {returnRequest.status === "COMPLETED" && returnRequest.completedAt && (
                      <div className="text-sm text-green-600">
                        완료일: {formatDate(returnRequest.completedAt)}
                      </div>
                    )}

                    {returnRequest.status === "REJECTED" && returnRequest.rejectedAt && (
                      <div className="text-sm text-red-600">
                        거부일: {formatDate(returnRequest.rejectedAt)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
