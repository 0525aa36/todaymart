'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface PageResponse {
  content: Seller[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    businessNumber: '',
    representative: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    commissionRate: 10,
    isActive: true,
    memo: '',
  })

  useEffect(() => {
    loadSellers()
  }, [currentPage])

  const loadSellers = async () => {
    try {
      setLoading(true)
      const response: PageResponse = await apiFetch(
        `/api/admin/sellers?page=${currentPage}&size=10&sort=createdAt,desc`,
        { auth: true }
      )
      setSellers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('판매자 목록 조회 실패:', error)
      alert('판매자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSellers()
      return
    }

    try {
      setLoading(true)
      const response: PageResponse = await apiFetch(
        `/api/admin/sellers/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=10`,
        { auth: true }
      )
      setSellers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('판매자 검색 실패:', error)
      alert('판매자 검색에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setIsEditing(false)
    setFormData({
      name: '',
      businessNumber: '',
      representative: '',
      phone: '',
      email: '',
      address: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      commissionRate: 10,
      isActive: true,
      memo: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (seller: Seller) => {
    setIsEditing(true)
    setSelectedSeller(seller)
    setFormData({
      name: seller.name,
      businessNumber: seller.businessNumber,
      representative: seller.representative,
      phone: seller.phone,
      email: seller.email || '',
      address: seller.address || '',
      bankName: seller.bankName,
      accountNumber: seller.accountNumber,
      accountHolder: seller.accountHolder,
      commissionRate: seller.commissionRate,
      isActive: seller.isActive,
      memo: seller.memo || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedSeller) {
        await apiFetch(`/api/admin/sellers/${selectedSeller.id}`, {
          auth: true,
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        alert('판매자 정보가 수정되었습니다.')
      } else {
        await apiFetch('/api/admin/sellers', {
          auth: true,
          method: 'POST',
          body: JSON.stringify(formData),
        })
        alert('판매자가 등록되었습니다.')
      }
      setIsModalOpen(false)
      loadSellers()
    } catch (error) {
      console.error('판매자 저장 실패:', error)
      alert('판매자 저장에 실패했습니다.')
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`판매자를 ${currentStatus ? '비활성화' : '활성화'}하시겠습니까?`)) {
      return
    }

    try {
      await apiFetch(`/api/admin/sellers/${id}/status`, {
        auth: true,
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      alert('판매자 상태가 변경되었습니다.')
      loadSellers()
    } catch (error) {
      console.error('판매자 상태 변경 실패:', error)
      alert('판매자 상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 판매자를 삭제하시겠습니까?')) {
      return
    }

    try {
      await apiFetch(`/api/admin/sellers/${id}`, {
        auth: true,
        method: 'DELETE',
      })
      alert('판매자가 삭제되었습니다.')
      loadSellers()
    } catch (error) {
      console.error('판매자 삭제 실패:', error)
      alert('판매자 삭제에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">판매자 관리</h1>
        <p className="text-gray-600">전체 판매자: {totalElements}명</p>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="판매자명으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          검색
        </Button>
        {searchQuery && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setCurrentPage(0)
              loadSellers()
            }}
          >
            초기화
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          판매자 등록
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>판매자명</TableHead>
              <TableHead>사업자번호</TableHead>
              <TableHead>대표자</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>수수료율</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : sellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  판매자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>{seller.id}</TableCell>
                  <TableCell className="font-medium">{seller.name}</TableCell>
                  <TableCell>{seller.businessNumber}</TableCell>
                  <TableCell>{seller.representative}</TableCell>
                  <TableCell>{seller.phone}</TableCell>
                  <TableCell>{seller.commissionRate}%</TableCell>
                  <TableCell>
                    <Switch
                      checked={seller.isActive}
                      onCheckedChange={() => handleToggleStatus(seller.id, seller.isActive)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(seller.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(seller)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(seller.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {totalElements > 0 && (
            <>
              {currentPage * 10 + 1}-{Math.min((currentPage + 1) * 10, totalElements)} / {totalElements}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center px-3">
            {currentPage + 1} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? '판매자 수정' : '판매자 등록'}</DialogTitle>
            <DialogDescription>
              판매자 정보를 입력하세요. * 는 필수 항목입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">판매자명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 청정농장"
              />
            </div>

            <div>
              <Label htmlFor="businessNumber">사업자등록번호 *</Label>
              <Input
                id="businessNumber"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                placeholder="예: 123-45-67890"
              />
            </div>

            <div>
              <Label htmlFor="representative">대표자명 *</Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                placeholder="예: 홍길동"
              />
            </div>

            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="예: 010-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="예: seller@example.com"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="예: 서울시 강남구 ..."
              />
            </div>

            <div>
              <Label htmlFor="bankName">은행명 *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="예: 국민은행"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">계좌번호 *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="예: 123456-78-901234"
              />
            </div>

            <div>
              <Label htmlFor="accountHolder">예금주 *</Label>
              <Input
                id="accountHolder"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="예: 홍길동"
              />
            </div>

            <div>
              <Label htmlFor="commissionRate">수수료율 (%) *</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="memo">메모</Label>
              <Input
                id="memo"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="메모 사항"
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>활성화</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
