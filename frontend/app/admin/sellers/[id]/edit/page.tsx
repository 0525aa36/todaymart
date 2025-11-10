"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

export default function EditSellerPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const sellerId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingSeller, setLoadingSeller] = useState(true)

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
    spreadsheetId: "",
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

    fetchSeller()
  }, [sellerId])

  const fetchSeller = async () => {
    try {
      const seller = await apiFetch<any>(`/api/admin/sellers/${sellerId}`, { auth: true })
      setFormData({
        name: seller.name || "",
        businessNumber: seller.businessNumber || "",
        representative: seller.representative || "",
        phone: seller.phone || "",
        email: seller.email || "",
        address: seller.address || "",
        bankName: seller.bankName || "",
        accountNumber: seller.accountNumber || "",
        accountHolder: seller.accountHolder || "",
        commissionRate: seller.commissionRate?.toString() || "10.00",
        isActive: seller.isActive !== undefined ? seller.isActive : true,
        memo: seller.memo || "",
        spreadsheetId: seller.spreadsheetId || "",
      })
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "판매자 정보를 불러올 수 없습니다."),
        variant: "destructive",
      })
    } finally {
      setLoadingSeller(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiFetch(`/api/admin/sellers/${sellerId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          ...formData,
          commissionRate: parseFloat(formData.commissionRate),
        }),
      })

      toast({
        title: "수정 완료",
        description: "판매자 정보가 성공적으로 수정되었습니다.",
      })

      router.push("/admin/sellers")
    } catch (error) {
      console.error("Error updating seller:", error)
      toast({
        title: "수정 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingSeller) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/sellers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            판매자 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>판매자 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">판매자명 *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자번호 *</Label>
                  <Input
                    id="businessNumber"
                    required
                    placeholder="123-45-67890"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representative">대표자명 *</Label>
                  <Input
                    id="representative"
                    required
                    value={formData.representative}
                    onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호 *</Label>
                  <Input
                    id="phone"
                    required
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">수수료율 (%) *</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    required
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소 *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* 정산 정보 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">정산 정보</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">은행명</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">계좌번호</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder">예금주</Label>
                  <Input
                    id="accountHolder"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 연동 정보 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">연동 정보</h3>

              <div className="space-y-2">
                <Label htmlFor="spreadsheetId">스프레드시트 ID</Label>
                <Input
                  id="spreadsheetId"
                  placeholder="구글 스프레드시트 ID"
                  value={formData.spreadsheetId}
                  onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                />
              </div>
            </div>

            {/* 기타 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">기타</h3>

              <div className="space-y-2">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  rows={4}
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">활성화 상태</Label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/sellers">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "수정 중..." : "수정 완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
