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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Power } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

interface Seller {
  id: number
  name: string
  businessNumber: string
  representative: string
  phone: string
  email: string
  address: string
  bankName: string
  accountNumber: string
  accountHolder: string
  commissionRate: number
  isActive: boolean
  memo: string
  spreadsheetId: string
  createdAt: string
  updatedAt: string
}

export default function AdminSellersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sellers, setSellers] = useState<Seller[]>([])
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

    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const data = await apiFetch<{ content?: Seller[] }>("/api/admin/sellers?size=100&sort=createdAt,desc", {
        auth: true,
      })
      setSellers(data.content || [])
    } catch (error) {
      console.error("Error fetching sellers:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "판매자 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (seller: Seller) => {
    router.push(`/admin/sellers/${seller.id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 이 판매자와 연결된 상품이 있을 경우 삭제되지 않습니다.")) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/admin/sellers/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "삭제 완료",
        description: "판매자가 삭제되었습니다.",
      })
      fetchSellers()
    } catch (error) {
      console.error("Error deleting seller:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "판매자 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (id: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/admin/sellers/${id}/toggle-status`, {
        method: "PUT",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "상태 변경 완료",
        description: "판매자 활성 상태가 변경되었습니다.",
      })
      fetchSellers()
    } catch (error) {
      console.error("Error toggling seller status:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "상태 변경 중 오류가 발생했습니다."),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">판매자 관리</h1>
          <p className="text-sm text-gray-500 mt-1">등록된 판매자를 관리하고 새 판매자를 추가하세요</p>
        </div>

        <Link href="/admin/sellers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            판매자 등록
          </Button>
        </Link>
      </div>

      {/* Sellers Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">등록된 판매자 ({sellers.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 판매자가 없습니다. 새 판매자를 등록해보세요!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>사업자명</TableHead>
                  <TableHead>사업자번호</TableHead>
                  <TableHead>대표자</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>수수료율</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.id}</TableCell>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.businessNumber}</TableCell>
                    <TableCell>{seller.representative}</TableCell>
                    <TableCell>{seller.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{seller.commissionRate}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seller.isActive ? "default" : "destructive"}>
                        {seller.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(seller.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(seller.id)}
                        className="mr-2"
                        title={seller.isActive ? "비활성화" : "활성화"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(seller)}
                        className="mr-2"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(seller.id)}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
