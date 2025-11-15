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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Edit,
  Trash2,
  Power,
  RefreshCw,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Percent,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { toast as sonnerToast } from "sonner"

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

interface SellerStatistics {
  totalSellers: number
  activeSellers: number
  inactiveSellers: number
  averageCommissionRate: number
}

interface SellerPage {
  content: Seller[]
  totalElements: number
  totalPages: number
  number: number
}

export default function AdminSellersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [statistics, setStatistics] = useState<SellerStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [keyword, setKeyword] = useState("")
  const [searchInput, setSearchInput] = useState("")

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
    fetchStatistics()
  }, [page, statusFilter, keyword])

  const fetchStatistics = async () => {
    try {
      const data = await apiFetch<{ content: Seller[] }>("/api/admin/sellers?size=1000", {
        auth: true,
      })
      const allSellers = data.content || []

      const stats: SellerStatistics = {
        totalSellers: allSellers.length,
        activeSellers: allSellers.filter(s => s.isActive).length,
        inactiveSellers: allSellers.filter(s => !s.isActive).length,
        averageCommissionRate: allSellers.length > 0
          ? allSellers.reduce((sum, s) => sum + s.commissionRate, 0) / allSellers.length
          : 0,
      }

      setStatistics(stats)
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  const fetchSellers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        sort: "createdAt,desc",
      })

      const data = await apiFetch<SellerPage>(`/api/admin/sellers?${params.toString()}`, {
        auth: true,
      })

      let filteredSellers = data.content || []

      // Filter by status
      if (statusFilter === "ACTIVE") {
        filteredSellers = filteredSellers.filter(s => s.isActive)
      } else if (statusFilter === "INACTIVE") {
        filteredSellers = filteredSellers.filter(s => !s.isActive)
      }

      // Filter by keyword
      if (keyword) {
        filteredSellers = filteredSellers.filter(s =>
          s.name.toLowerCase().includes(keyword.toLowerCase()) ||
          s.representative.toLowerCase().includes(keyword.toLowerCase()) ||
          s.businessNumber.includes(keyword)
        )
      }

      setSellers(filteredSellers)
      setTotalElements(filteredSellers.length)
      setTotalPages(Math.ceil(filteredSellers.length / 20))
    } catch (error) {
      console.error("Error fetching sellers:", error)
      sonnerToast.error("판매자 목록을 불러오는 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(0)
  }

  const handleRefresh = () => {
    fetchSellers()
    fetchStatistics()
    sonnerToast.success("새로고침 완료")
  }

  const handleEdit = (seller: Seller) => {
    router.push(`/admin/sellers/${seller.id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 이 판매자와 연결된 상품이 있을 경우 삭제되지 않습니다.")) return

    try {
      await apiFetch(`/api/admin/sellers/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      sonnerToast.success("판매자가 삭제되었습니다")
      fetchSellers()
      fetchStatistics()
    } catch (error) {
      console.error("Error deleting seller:", error)
      sonnerToast.error(getErrorMessage(error, "판매자 삭제 중 오류가 발생했습니다"))
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await apiFetch(`/api/admin/sellers/${id}/toggle-status`, {
        method: "PUT",
        auth: true,
        parseResponse: "none",
      })

      sonnerToast.success("판매자 활성 상태가 변경되었습니다")
      fetchSellers()
      fetchStatistics()
    } catch (error) {
      console.error("Error toggling seller status:", error)
      sonnerToast.error(getErrorMessage(error, "상태 변경 중 오류가 발생했습니다"))
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">판매자 관리</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 판매자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSellers}</div>
              <p className="text-xs text-muted-foreground">
                등록된 판매자 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 판매자</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{statistics.activeSellers}</div>
              <p className="text-xs text-muted-foreground">
                현재 활성화된 판매자
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">비활성 판매자</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{statistics.inactiveSellers}</div>
              <p className="text-xs text-muted-foreground">
                비활성화된 판매자
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 수수료율</CardTitle>
              <Percent className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {statistics.averageCommissionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                전체 판매자 평균
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="활성 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="사업자명, 대표자명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Link href="/admin/sellers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            판매자 등록
          </Button>
        </Link>
      </div>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>판매자 목록 ({totalElements}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              판매자가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>사업자명</TableHead>
                    <TableHead>사업자번호</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>수수료율</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((seller) => (
                    <TableRow key={seller.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{seller.id}</TableCell>
                      <TableCell className="font-medium">{seller.name}</TableCell>
                      <TableCell>{seller.businessNumber}</TableCell>
                      <TableCell>{seller.representative}</TableCell>
                      <TableCell>{seller.phone || "-"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{seller.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {seller.commissionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={seller.isActive ? "default" : "destructive"}
                          className={seller.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {seller.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(seller.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(seller.id)}
                            className="h-8 w-8 p-0"
                            title={seller.isActive ? "비활성화" : "활성화"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(seller)}
                            className="h-8 w-8 p-0"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(seller.id)}
                            className="h-8 w-8 p-0"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    이전
                  </Button>
                  <span className="flex items-center px-4">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
