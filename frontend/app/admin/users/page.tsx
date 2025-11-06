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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserDto {
  id: number
  name: string
  email: string
  phone: string
  role: string
  enabled: boolean
  createdAt: string
  orderCount: number
  totalSpent: number
}

interface OrderSummary {
  id: number
  orderNumber: string
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  createdAt: string
}

interface UserDetailDto extends UserDto {
  recentOrders: OrderSummary[]
}

interface PageResponse {
  content: UserDto[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetailDto | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response: PageResponse = await apiFetch(
        `/api/admin/users?page=${currentPage}&size=10&sort=createdAt,desc`,
        { auth: true }
      )
      setUsers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      alert('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers()
      return
    }

    try {
      setLoading(true)
      const response: PageResponse = await apiFetch(
        `/api/admin/users/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=10`,
        { auth: true }
      )
      setUsers(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (error) {
      console.error('사용자 검색 실패:', error)
      alert('사용자 검색에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (userId: number) => {
    try {
      const userDetail: UserDetailDto = await apiFetch(`/api/admin/users/${userId}`, {
        auth: true,
      })
      setSelectedUser(userDetail)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('사용자 상세 조회 실패:', error)
      alert('사용자 상세 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`사용자를 ${currentStatus ? '비활성화' : '활성화'}하시겠습니까?`)) {
      return
    }

    try {
      await apiFetch(`/api/admin/users/${userId}/status`, {
        auth: true,
        method: 'PUT',
        body: JSON.stringify({ enabled: !currentStatus }),
      })
      alert('사용자 상태가 변경되었습니다.')
      loadUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, enabled: !currentStatus })
      }
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error)
      alert('사용자 상태 변경에 실패했습니다.')
    }
  }

  const handleChangeRole = async (userId: number, newRole: string) => {
    if (!confirm(`사용자 권한을 ${newRole}로 변경하시겠습니까?`)) {
      return
    }

    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        auth: true,
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      })
      alert('사용자 권한이 변경되었습니다.')
      loadUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole })
      }
    } catch (error) {
      console.error('사용자 권한 변경 실패:', error)
      alert('사용자 권한 변경에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ROLE_ADMIN') {
      return <Badge variant="destructive">관리자</Badge>
    }
    return <Badge variant="secondary">일반 사용자</Badge>
  }

  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: '대기중', variant: 'secondary' },
      CONFIRMED: { label: '확인됨', variant: 'default' },
      SHIPPED: { label: '배송중', variant: 'default' },
      DELIVERED: { label: '배송완료', variant: 'default' },
      CANCELLED: { label: '취소됨', variant: 'destructive' },
    }
    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: '대기중', variant: 'secondary' },
      PAID: { label: '결제완료', variant: 'default' },
      FAILED: { label: '결제실패', variant: 'destructive' },
      CANCELLED: { label: '취소됨', variant: 'destructive' },
    }
    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
        <p className="text-gray-600">전체 사용자: {totalElements}명</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="이름 또는 이메일로 검색"
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
              loadUsers()
            }}
          >
            초기화
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>권한</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>주문수</TableHead>
              <TableHead>총 구매액</TableHead>
              <TableHead>가입일</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.enabled}
                      onCheckedChange={() => handleToggleStatus(user.id, user.enabled)}
                    />
                  </TableCell>
                  <TableCell>{user.orderCount}</TableCell>
                  <TableCell>{formatCurrency(user.totalSpent)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(user.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>사용자 상세 정보</DialogTitle>
            <DialogDescription>
              사용자 정보 및 주문 내역을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">이름</p>
                  <p className="font-semibold">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">이메일</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">전화번호</p>
                  <p className="font-semibold">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">가입일</p>
                  <p className="font-semibold">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">권한</p>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => handleChangeRole(selectedUser.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROLE_USER">일반 사용자</SelectItem>
                      <SelectItem value="ROLE_ADMIN">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">상태</p>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedUser.enabled}
                      onCheckedChange={() =>
                        handleToggleStatus(selectedUser.id, selectedUser.enabled)
                      }
                    />
                    <span>{selectedUser.enabled ? '활성' : '비활성'}</span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">총 주문 수</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedUser.orderCount}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">총 구매액</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedUser.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="text-lg font-semibold mb-3">최근 주문 내역 (최대 10개)</h3>
                {selectedUser.recentOrders.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">주문 내역이 없습니다.</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문번호</TableHead>
                          <TableHead>금액</TableHead>
                          <TableHead>주문상태</TableHead>
                          <TableHead>결제상태</TableHead>
                          <TableHead>주문일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>{getOrderStatusBadge(order.orderStatus)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
