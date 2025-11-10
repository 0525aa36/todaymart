'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Plus, Edit, Trash2, Pin, PinOff, Eye } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Notice {
  id: number
  title: string
  content: string
  imageUrl?: string
  isPinned: boolean
  isPopup: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminNoticesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [notices, setNotices] = useState<Notice[]>([])
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

    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const data = await apiFetch<Notice[]>("/api/admin/notices", { auth: true })
      setNotices(data)
    } catch (error) {
      console.error("Error fetching notices:", error)
      toast({
        title: "오류",
        description: "공지사항 목록을 불러오지 못했습니다",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePinned = async (notice: Notice) => {
    try {
      await apiFetch(`/api/admin/notices/${notice.id}/toggle-pinned`, {
        auth: true,
        method: "PUT",
      })
      toast({
        title: "상태 변경 완료",
        description: notice.isPinned ? "고정이 해제되었습니다" : "상단에 고정되었습니다",
      })
      fetchNotices()
    } catch (error) {
      console.error("Error toggling pinned:", error)
      toast({
        title: "오류",
        description: "고정 상태 변경에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  const handleTogglePopup = async (notice: Notice) => {
    try {
      await apiFetch(`/api/admin/notices/${notice.id}/toggle-popup`, {
        auth: true,
        method: "PUT",
      })
      toast({
        title: "상태 변경 완료",
        description: notice.isPopup ? "팝업이 해제되었습니다" : "팝업으로 설정되었습니다",
      })
      fetchNotices()
    } catch (error) {
      console.error("Error toggling popup:", error)
      toast({
        title: "오류",
        description: "팝업 상태 변경에 실패했습니다",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/admin/notices/${id}`, {
        auth: true,
        method: "DELETE",
        parseResponse: "none",
      })
      toast({
        title: "삭제 완료",
        description: "공지사항이 삭제되었습니다",
      })
      fetchNotices()
    } catch (error) {
      console.error("Error deleting notice:", error)
      toast({
        title: "오류",
        description: "공지사항 삭제에 실패했습니다",
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">공지사항 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            공지사항을 작성하고 고정/팝업 설정을 관리합니다
          </p>
        </div>
        <Link href="/admin/help/notices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            공지사항 추가
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            등록된 공지사항 ({notices.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 공지사항이 없습니다. 새 공지사항을 추가해보세요!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">{notice.id}</TableCell>
                    <TableCell className="font-medium max-w-md">
                      {notice.isPinned && (
                        <Pin className="inline h-3 w-3 mr-1 text-orange-600" />
                      )}
                      {notice.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {notice.viewCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {notice.isPinned && (
                          <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                            고정
                          </span>
                        )}
                        {notice.isPopup && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            팝업
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(notice.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePinned(notice)}
                          title={notice.isPinned ? "고정 해제" : "상단 고정"}
                        >
                          {notice.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePopup(notice)}
                          title={notice.isPopup ? "팝업 해제" : "팝업 설정"}
                          className={notice.isPopup ? "text-purple-600" : ""}
                        >
                          P
                        </Button>
                        <Link href={`/admin/help/notices/${notice.id}/edit`}>
                          <Button variant="ghost" size="icon" title="수정">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notice.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
