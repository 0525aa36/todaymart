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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Plus, ChevronLeft, ChevronRight, FileText, CheckCircle, XCircle } from 'lucide-react'

interface Seller {
  id: number
  name: string
  businessNumber: string
  representative: string
  phone: string
  commissionRate: number
}

interface Settlement {
  id: number
  seller: Seller
  startDate: string
  endDate: string
  totalSalesAmount: number
  commissionAmount: number
  settlementAmount: number
  commissionRate: number
  orderCount: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  settledAt: string | null
  settledBy: string | null
  memo: string | null
  createdAt: string
}

interface PageResponse {
  content: Settlement[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

type StatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sellerFilter, setSellerFilter] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state for single settlement creation
  const [createForm, setCreateForm] = useState({
    sellerId: '',
    startDate: '',
    endDate: '',
  })

  // Form state for bulk settlement creation
  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadSettlements()
    loadSellers()
  }, [currentPage, statusFilter, sellerFilter])

  const loadSettlements = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/settlements?page=' + currentPage + '&size=10&sort=createdAt,desc'

      if (statusFilter !== 'ALL') {
        url = `/api/admin/settlements/status/${statusFilter}?page=${currentPage}&size=10&sort=createdAt,desc`
      }

      if (sellerFilter) {
        url = `/api/admin/settlements/seller/${sellerFilter}?page=${currentPage}&size=10&sort=createdAt,desc`
      }

      const response: PageResponse = await apiFetch(url, { auth: true })
      setSettlements(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('정산 목록 조회 실패:', error)
      alert('정산 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadSellers = async () => {
    try {
      const response: PageResponse = await apiFetch('/api/admin/sellers/active?size=1000', { auth: true })
      setSellers(response.content)
    } catch (error) {
      console.error('판매자 목록 조회 실패:', error)
    }
  }

  const handleCreateSettlement = async () => {
    if (!createForm.sellerId || !createForm.startDate || !createForm.endDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      await apiFetch('/api/admin/settlements', {
        auth: true,
        method: 'POST',
        body: JSON.stringify({
          sellerId: parseInt(createForm.sellerId),
          startDate: createForm.startDate,
          endDate: createForm.endDate,
        }),
      })
      alert('정산이 생성되었습니다.')
      setIsCreateModalOpen(false)
      setCreateForm({ sellerId: '', startDate: '', endDate: '' })
      loadSettlements()
    } catch (error) {
      console.error('정산 생성 실패:', error)
      alert('정산 생성에 실패했습니다.')
    }
  }

  const handleBulkCreate = async () => {
    if (!bulkForm.startDate || !bulkForm.endDate) {
      alert('시작일과 종료일을 입력해주세요.')
      return
    }

    if (!confirm('모든 활성 판매자에 대한 정산을 생성하시겠습니까?')) {
      return
    }

    try {
      const response = await apiFetch('/api/admin/settlements/bulk', {
        auth: true,
        method: 'POST',
        body: JSON.stringify({
          startDate: bulkForm.startDate,
          endDate: bulkForm.endDate,
        }),
      })
      alert(response.message || '일괄 정산이 생성되었습니다.')
      setIsBulkModalOpen(false)
      setBulkForm({ startDate: '', endDate: '' })
      loadSettlements()
    } catch (error) {
      console.error('일괄 정산 생성 실패:', error)
      alert('일괄 정산 생성에 실패했습니다.')
    }
  }

  const handleCompleteSettlement = async (id: number) => {
    if (!confirm('이 정산을 완료 처리하시겠습니까?')) {
      return
    }

    try {
      await apiFetch(`/api/admin/settlements/${id}/complete`, {
        auth: true,
        method: 'PUT',
      })
      alert('정산이 완료되었습니다.')
      loadSettlements()
      if (selectedSettlement?.id === id) {
        setIsDetailModalOpen(false)
      }
    } catch (error) {
      console.error('정산 완료 실패:', error)
      alert('정산 완료 처리에 실패했습니다.')
    }
  }

  const handleCancelSettlement = async (id: number) => {
    if (!confirm('이 정산을 취소하시겠습니까?')) {
      return
    }

    try {
      await apiFetch(`/api/admin/settlements/${id}/cancel`, {
        auth: true,
        method: 'PUT',
      })
      alert('정산이 취소되었습니다.')
      loadSettlements()
      if (selectedSettlement?.id === id) {
        setIsDetailModalOpen(false)
      }
    } catch (error) {
      console.error('정산 취소 실패:', error)
      alert('정산 취소에 실패했습니다.')
    }
  }

  const handleViewDetail = async (id: number) => {
    try {
      const settlement: Settlement = await apiFetch(`/api/admin/settlements/${id}`, { auth: true })
      setSelectedSettlement(settlement)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('정산 상세 조회 실패:', error)
      alert('정산 상세 정보를 불러오는데 실패했습니다.')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50">대기</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50">완료</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-50">취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">정산 관리</h1>
        <p className="text-gray-600">전체 정산: {totalElements}건</p>
      </div>

      {/* Filters & Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value as StatusFilter)
          setCurrentPage(0)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="PENDING">대기</SelectItem>
            <SelectItem value="COMPLETED">완료</SelectItem>
            <SelectItem value="CANCELLED">취소</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sellerFilter?.toString() || 'ALL'} onValueChange={(value) => {
          setSellerFilter(value === 'ALL' ? null : parseInt(value))
          setCurrentPage(0)
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="판매자 필터" />
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

        {(statusFilter !== 'ALL' || sellerFilter !== null) && (
          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('ALL')
              setSellerFilter(null)
              setCurrentPage(0)
            }}
          >
            필터 초기화
          </Button>
        )}

        <div className="flex-1" />

        <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          일괄 정산 생성
        </Button>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          정산 생성
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>판매자</TableHead>
              <TableHead>정산 기간</TableHead>
              <TableHead>주문 건수</TableHead>
              <TableHead>매출액</TableHead>
              <TableHead>수수료</TableHead>
              <TableHead>정산 금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : settlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  정산 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell>{settlement.id}</TableCell>
                  <TableCell className="font-medium">{settlement.seller.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(settlement.startDate)} ~ {formatDate(settlement.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>{settlement.orderCount}건</TableCell>
                  <TableCell>{formatCurrency(settlement.totalSalesAmount)}</TableCell>
                  <TableCell className="text-red-600">
                    -{formatCurrency(settlement.commissionAmount)}
                    <div className="text-xs text-gray-500">({settlement.commissionRate}%)</div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(settlement.settlementAmount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                  <TableCell>{formatDate(settlement.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(settlement.id)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {settlement.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteSettlement(settlement.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSettlement(settlement.id)}
                            className="text-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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

      {/* Create Settlement Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 생성</DialogTitle>
            <DialogDescription>
              판매자와 정산 기간을 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="seller">판매자 *</Label>
              <Select value={createForm.sellerId} onValueChange={(value) => setCreateForm({ ...createForm, sellerId: value })}>
                <SelectTrigger id="seller">
                  <SelectValue placeholder="판매자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id.toString()}>
                      {seller.name} ({seller.commissionRate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">시작일 *</Label>
              <Input
                id="startDate"
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">종료일 *</Label>
              <Input
                id="endDate"
                type="date"
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateSettlement}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 정산 생성</DialogTitle>
            <DialogDescription>
              모든 활성 판매자에 대한 정산을 한번에 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkStartDate">시작일 *</Label>
              <Input
                id="bulkStartDate"
                type="date"
                value={bulkForm.startDate}
                onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bulkEndDate">종료일 *</Label>
              <Input
                id="bulkEndDate"
                type="date"
                value={bulkForm.endDate}
                onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded text-sm">
              활성 상태인 모든 판매자({sellers.length}명)에 대한 정산이 생성됩니다.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBulkCreate}>
              일괄 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>정산 상세</DialogTitle>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">정산 ID</Label>
                  <div className="font-medium">{selectedSettlement.id}</div>
                </div>
                <div>
                  <Label className="text-gray-500">상태</Label>
                  <div>{getStatusBadge(selectedSettlement.status)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">판매자 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">판매자명</Label>
                    <div className="font-medium">{selectedSettlement.seller.name}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">사업자번호</Label>
                    <div>{selectedSettlement.seller.businessNumber}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">대표자</Label>
                    <div>{selectedSettlement.seller.representative}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">연락처</Label>
                    <div>{selectedSettlement.seller.phone}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">정산 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">정산 기간</Label>
                    <div>
                      {formatDate(selectedSettlement.startDate)} ~ {formatDate(selectedSettlement.endDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">주문 건수</Label>
                    <div>{selectedSettlement.orderCount}건</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">총 매출액</Label>
                    <div className="text-lg font-semibold">{formatCurrency(selectedSettlement.totalSalesAmount)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">수수료 ({selectedSettlement.commissionRate}%)</Label>
                    <div className="text-lg font-semibold text-red-600">
                      -{formatCurrency(selectedSettlement.commissionAmount)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">정산 금액</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSettlement.settlementAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedSettlement.status === 'COMPLETED' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">완료 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">완료 일시</Label>
                      <div>{formatDate(selectedSettlement.settledAt)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-500">처리자</Label>
                      <div>{selectedSettlement.settledBy}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSettlement.memo && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500">메모</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">{selectedSettlement.memo}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedSettlement?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleCancelSettlement(selectedSettlement.id)}
                  className="text-red-600"
                >
                  정산 취소
                </Button>
                <Button
                  onClick={() => handleCompleteSettlement(selectedSettlement.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  정산 완료
                </Button>
              </>
            )}
            {selectedSettlement?.status !== 'PENDING' && (
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
