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
import { ArrowLeft, Shield, User as UserIcon, Search } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { AdminLoadingSpinner } from "@/components/admin/AdminLoadingSpinner"
import { SortableTableHead, SortDirection } from "@/components/ui/sortable-table-head"

interface User {
  id: number
  email: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  postcode: string
  birthDate: string
  gender: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage] = useState(10)

  // Sorting states
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

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

    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      let url = "/api/admin/users?size=100&sort=id,asc"
      if (roleFilter) {
        url += `&role=${roleFilter}`
      }

      const data = await apiFetch<{ content?: User[] }>(url, {
        auth: true,
      })
      setUsers(data.content || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "사용자 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchUsers()
      return
    }

    try {
      const data = await apiFetch<{ content?: User[] }>(
        `/api/admin/users?keyword=${encodeURIComponent(searchKeyword)}&size=100`,
        { auth: true }
      )
      setUsers(data.content || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "사용자 검색 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleChangeRole = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role === "ADMIN" ? "USER" : "ADMIN")
    setRoleDialogOpen(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser) return

    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ role: newRole }),
        parseResponse: "none",
      })

      toast({
        title: "역할 변경 완료",
        description: `${selectedUser.name}님의 역할이 ${newRole}로 변경되었습니다.`,
      })
      setRoleDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error changing user role:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "역할 변경 중 오류가 발생했습니다."),
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    user.email.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0

    const direction = sortDirection === "asc" ? 1 : -1

    switch (sortKey) {
      case "id":
        return (a.id - b.id) * direction
      case "name":
        return a.name.localeCompare(b.name) * direction
      case "email":
        return a.email.localeCompare(b.email) * direction
      case "phone":
        return a.phone.localeCompare(b.phone) * direction
      case "birthDate":
        return (new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()) * direction
      case "role":
        return a.role.localeCompare(b.role) * direction
      case "createdAt":
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
  const paginatedUsers = sortedUsers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">사용자 관리</h1>
            <p className="text-sm text-gray-500 mt-1">등록된 사용자를 관리하고 역할을 변경하세요</p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="이름 또는 이메일로 검색..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    검색
                  </Button>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">전체 역할</option>
                  <option value="USER">일반 사용자</option>
                  <option value="ADMIN">관리자</option>
                </select>
              </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-gray-900">등록된 사용자 ({filteredUsers.length}명)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <AdminLoadingSpinner type="table" />
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  사용자가 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="id"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="w-[60px]"
                      >
                        ID
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="name"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        이름
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="email"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        이메일
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="phone"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        전화번호
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="birthDate"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        생년월일
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="role"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        역할
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="createdAt"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      >
                        가입일
                      </SortableTableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{formatDate(user.birthDate)}</TableCell>
                        <TableCell>
                          {user.role === "ADMIN" ? (
                            <Badge style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
                              <Shield className="h-3 w-3 mr-1" />
                              관리자
                            </Badge>
                          ) : (
                            <Badge style={{ backgroundColor: "var(--color-secondary-600)", color: "var(--color-secondary-foreground)" }}>
                              <UserIcon className="h-3 w-3 mr-1" />
                              일반 사용자
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeRole(user)}
                          >
                            {user.role === "ADMIN" ? "일반 사용자로 변경" : "관리자로 변경"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={sortedUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(newPage) => {
              setCurrentPage(newPage)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경 확인</DialogTitle>
            <DialogDescription>
              정말로 이 사용자의 역할을 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">사용자:</span>
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">이메일:</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">현재 역할:</span>
                  <Badge variant={selectedUser.role === "ADMIN" ? "destructive" : "secondary"}>
                    {selectedUser.role === "ADMIN" ? "관리자" : "일반 사용자"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">변경할 역할:</span>
                  <Badge variant={newRole === "ADMIN" ? "destructive" : "secondary"}>
                    {newRole === "ADMIN" ? "관리자" : "일반 사용자"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmRoleChange}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
