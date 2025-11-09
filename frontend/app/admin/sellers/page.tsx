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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, ArrowLeft, Power } from "lucide-react"
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
  createdAt: string
  updatedAt: string
}

export default function AdminSellersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    businessNumber: "",
    representative: "",
    phone: "",
    email: "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    commissionRate: "10.00",
    isActive: true,
    memo: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return

    // 사업자등록번호 중복 체크 (신규 등록 또는 사업자등록번호 변경 시)
    if (!editingSeller || formData.businessNumber !== editingSeller.businessNumber) {
      try {
        const isDuplicate = await apiFetch<boolean>(
          `/api/admin/sellers/check-business-number?businessNumber=${encodeURIComponent(formData.businessNumber)}`,
          { auth: true }
        )
        if (isDuplicate) {
          toast({
            title: "중복된 사업자등록번호",
            description: "이미 등록된 사업자등록번호입니다.",
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        console.error("Error checking business number:", error)
        toast({
          title: "오류",
          description: "사업자등록번호 중복 확인 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        return
      }
    }

    const sellerData = {
      name: formData.name,
      businessNumber: formData.businessNumber,
      representative: formData.representative,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder,
      commissionRate: parseFloat(formData.commissionRate),
      isActive: formData.isActive,
      memo: formData.memo,
    }

    try {
      const url = editingSeller ? `/api/admin/sellers/${editingSeller.id}` : "/api/admin/sellers"

      await apiFetch(url, {
        method: editingSeller ? "PUT" : "POST",
        auth: true,
        body: JSON.stringify(sellerData),
        parseResponse: "none",
      })

      toast({
        title: editingSeller ? "수정 완료" : "등록 완료",
        description: `판매자가 성공적으로 ${editingSeller ? "수정" : "등록"}되었습니다.`,
      })
      setDialogOpen(false)
      resetForm()
      fetchSellers()
    } catch (error) {
      console.error("Error saving seller:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "판매자 저장 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (seller: Seller) => {
    setEditingSeller(seller)
    setFormData({
      name: seller.name,
      businessNumber: seller.businessNumber,
      representative: seller.representative,
      phone: seller.phone,
      email: seller.email,
      address: seller.address,
      bankName: seller.bankName,
      accountNumber: seller.accountNumber,
      accountHolder: seller.accountHolder,
      commissionRate: seller.commissionRate.toString(),
      isActive: seller.isActive,
      memo: seller.memo || "",
    })
    setDialogOpen(true)
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

  const resetForm = () => {
    setEditingSeller(null)
    setFormData({
      name: "",
      businessNumber: "",
      representative: "",
      phone: "",
      email: "",
      address: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      commissionRate: "10.00",
      isActive: true,
      memo: "",
    })
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
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

            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingSeller(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  판매자 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingSeller ? "판매자 수정" : "새 판매자 등록"}</DialogTitle>
                    <DialogDescription>
                      {editingSeller ? "판매자 정보를 수정하세요" : "새로운 판매자 정보를 입력하세요"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* 기본 정보 */}
                    <div className="grid gap-2">
                      <Label htmlFor="name">사업자명 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="예: (주)온농농산"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="businessNumber">사업자등록번호 *</Label>
                        <Input
                          id="businessNumber"
                          value={formData.businessNumber}
                          onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                          required
                          placeholder="123-45-67890"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="representative">대표자명 *</Label>
                        <Input
                          id="representative"
                          value={formData.representative}
                          onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                          required
                          placeholder="홍길동"
                        />
                      </div>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">전화번호</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="010-1234-5678"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="seller@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">주소</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="서울시 강남구..."
                      />
                    </div>

                    {/* 계좌 정보 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bankName">은행명</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="국민은행"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="accountNumber">계좌번호</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="123456-78-901234"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="accountHolder">예금주</Label>
                        <Input
                          id="accountHolder"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                          placeholder="홍길동"
                        />
                      </div>
                    </div>

                    {/* 수수료율 및 활성 상태 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="commissionRate">수수료율 (%) *</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          value={formData.commissionRate}
                          onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                          required
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="10.00"
                        />
                        <p className="text-xs text-muted-foreground">판매 금액에서 차감할 수수료율</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="isActive">활성 상태</Label>
                        <div className="flex items-center space-x-2 h-10">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="isActive" className="cursor-pointer">
                            활성화
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* 메모 */}
                    <div className="grid gap-2">
                      <Label htmlFor="memo">메모</Label>
                      <Textarea
                        id="memo"
                        value={formData.memo}
                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                        rows={3}
                        placeholder="판매자에 대한 추가 정보나 메모를 입력하세요"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      취소
                    </Button>
                    <Button type="submit">{editingSeller ? "수정" : "등록"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
