'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Pin, PinOff, Eye } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { toast } from "sonner"
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
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    isPinned: false,
    isPopup: false,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const data = await apiFetch<Notice[]>("/api/admin/notices", { auth: true })
      setNotices(data)
    } catch (error) {
      console.error("Error fetching notices:", error)
      toast.error("공지사항 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice)
      setFormData({
        title: notice.title,
        content: notice.content,
        imageUrl: notice.imageUrl || "",
        isPinned: notice.isPinned,
        isPopup: notice.isPopup,
      })
    } else {
      setEditingNotice(null)
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        isPinned: false,
        isPopup: false,
      })
    }
    setImageFile(null)
    setDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다")
      return
    }

    setImageFile(file)
    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, imageUrl: data.fileUrl || data.url }))
      toast.success("이미지가 업로드되었습니다")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("이미지 업로드에 실패했습니다")
      setImageFile(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요")
      return
    }

    if (!formData.content.trim()) {
      toast.error("내용을 입력해주세요")
      return
    }

    try {
      if (editingNotice) {
        await apiFetch(`/api/admin/notices/${editingNotice.id}`, {
          auth: true,
          method: "PUT",
          body: JSON.stringify(formData),
        })
        toast.success("공지사항이 수정되었습니다")
      } else {
        await apiFetch("/api/admin/notices", {
          auth: true,
          method: "POST",
          body: JSON.stringify(formData),
        })
        toast.success("공지사항이 생성되었습니다")
      }

      setDialogOpen(false)
      fetchNotices()
    } catch (error) {
      console.error("Error saving notice:", error)
      toast.error("공지사항 저장에 실패했습니다")
    }
  }

  const handleTogglePinned = async (notice: Notice) => {
    try {
      await apiFetch(`/api/admin/notices/${notice.id}/toggle-pinned`, {
        auth: true,
        method: "PUT",
      })
      toast.success(notice.isPinned ? "고정이 해제되었습니다" : "상단에 고정되었습니다")
      fetchNotices()
    } catch (error) {
      console.error("Error toggling pinned:", error)
      toast.error("고정 상태 변경에 실패했습니다")
    }
  }

  const handleTogglePopup = async (notice: Notice) => {
    try {
      await apiFetch(`/api/admin/notices/${notice.id}/toggle-popup`, {
        auth: true,
        method: "PUT",
      })
      toast.success(notice.isPopup ? "팝업이 해제되었습니다" : "팝업으로 설정되었습니다")
      fetchNotices()
    } catch (error) {
      console.error("Error toggling popup:", error)
      toast.error("팝업 상태 변경에 실패했습니다")
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
      toast.success("공지사항이 삭제되었습니다")
      fetchNotices()
    } catch (error) {
      console.error("Error deleting notice:", error)
      toast.error("공지사항 삭제에 실패했습니다")
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-muted-foreground mt-1">
            공지사항을 작성하고 고정/팝업 설정을 관리합니다
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          공지사항 추가
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">등록된 공지사항이 없습니다</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell>
                  {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePinned(notice)}
                      title={notice.isPinned ? "고정 해제" : "상단 고정"}
                    >
                      {notice.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePopup(notice)}
                      title={notice.isPopup ? "팝업 해제" : "팝업 설정"}
                      className={notice.isPopup ? "text-purple-600" : ""}
                    >
                      P
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(notice)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notice.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNotice ? "공지사항 수정" : "공지사항 추가"}</DialogTitle>
            <DialogDescription>공지사항 정보를 입력하세요</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="공지사항 내용을 입력하세요"
                rows={10}
                required
              />
            </div>

            <div>
              <Label htmlFor="imageFile">이미지 업로드 (선택)</Label>
              <div className="space-y-2">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-sm text-muted-foreground">업로드 중...</p>}
                {formData.imageUrl && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">✓ 이미지가 업로드되었습니다</p>
                    <img
                      src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${API_BASE_URL}${formData.imageUrl}`}
                      alt="Preview"
                      className="max-w-xs h-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>상단 고정</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopup}
                  onChange={(e) => setFormData({ ...formData, isPopup: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>팝업으로 표시</span>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={uploadingImage}>
                {uploadingImage ? "업로드 중..." : editingNotice ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
