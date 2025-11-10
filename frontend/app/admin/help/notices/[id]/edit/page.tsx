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
import { apiFetch, getErrorMessage, API_BASE_URL } from "@/lib/api-client"

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

export default function EditNoticePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const noticeId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingNotice, setLoadingNotice] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    isPinned: false,
    isPopup: false,
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

    fetchNotice()
  }, [noticeId])

  const fetchNotice = async () => {
    try {
      const notice = await apiFetch<Notice>(`/api/admin/notices/${noticeId}`, { auth: true })
      setFormData({
        title: notice.title || "",
        content: notice.content || "",
        imageUrl: notice.imageUrl || "",
        isPinned: notice.isPinned !== undefined ? notice.isPinned : false,
        isPopup: notice.isPopup !== undefined ? notice.isPopup : false,
      })
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "공지사항 정보를 불러올 수 없습니다."),
        variant: "destructive",
      })
    } finally {
      setLoadingNotice(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "업로드 실패",
        description: "이미지 파일만 업로드 가능합니다",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "업로드 실패",
        description: "파일 크기는 5MB 이하여야 합니다",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, imageUrl: data.fileUrl || data.url }))
      toast({
        title: "업로드 완료",
        description: "이미지가 업로드되었습니다",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!formData.content.trim()) {
      toast({
        title: "입력 오류",
        description: "내용을 입력해주세요",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      await apiFetch(`/api/admin/notices/${noticeId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(formData),
      })

      toast({
        title: "수정 완료",
        description: "공지사항이 성공적으로 수정되었습니다.",
      })

      router.push("/admin/help/notices")
    } catch (error) {
      console.error("Error updating notice:", error)
      toast({
        title: "수정 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingNotice) {
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
        <Link href="/admin/help/notices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            공지사항 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공지사항 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={10}
                />
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">이미지 첨부</h3>

              <div className="space-y-2">
                <Label htmlFor="imageFile">이미지 업로드 (선택)</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <p className="text-xs text-muted-foreground">
                  이미지 파일만 업로드 가능합니다 (최대 5MB)
                </p>
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

            {/* 설정 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">공지 설정</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                  />
                  <Label htmlFor="isPinned">상단 고정</Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    공지사항 목록 상단에 고정됩니다
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopup"
                    checked={formData.isPopup}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopup: checked })}
                  />
                  <Label htmlFor="isPopup">팝업으로 표시</Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    사용자가 사이트 접속 시 팝업으로 표시됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/help/notices">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading || uploadingImage}>
                {loading ? "수정 중..." : "수정 완료"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
