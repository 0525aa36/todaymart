"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Banner {
  id: number
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  displayOrder: number
  isActive: boolean
  backgroundColor: string
  textColor: string
}

export default function BannersAdminPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    displayOrder: 0,
    isActive: true,
    backgroundColor: "#f5f5f5",
    textColor: "#000000",
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const data = await apiFetch<Banner[]>("/api/admin/banners", { auth: true })
      setBanners(data)
    } catch (error) {
      console.error("Error fetching banners:", error)
      toast.error("배너 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        description: banner.description || "",
        imageUrl: banner.imageUrl || "",
        linkUrl: banner.linkUrl || "",
        displayOrder: banner.displayOrder,
        isActive: banner.isActive,
        backgroundColor: banner.backgroundColor || "#f5f5f5",
        textColor: banner.textColor || "#000000",
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        displayOrder: 0,
        isActive: true,
        backgroundColor: "#f5f5f5",
        textColor: "#000000",
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
      console.log("Upload response:", data)
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

    if (!formData.title) {
      toast.error("제목을 입력해주세요")
      return
    }

    if (!formData.imageUrl) {
      toast.error("이미지를 업로드해주세요")
      return
    }

    try {
      if (editingBanner) {
        await apiFetch(`/api/admin/banners/${editingBanner.id}`, {
          auth: true,
          method: "PUT",
          body: JSON.stringify(formData),
        })
        toast.success("배너가 수정되었습니다")
      } else {
        await apiFetch("/api/admin/banners", {
          auth: true,
          method: "POST",
          body: JSON.stringify(formData),
        })
        toast.success("배너가 생성되었습니다")
      }

      setDialogOpen(false)
      fetchBanners()
    } catch (error) {
      console.error("Error saving banner:", error)
      toast.error("배너 저장에 실패했습니다")
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      await apiFetch(`/api/admin/banners/${banner.id}/toggle`, {
        auth: true,
        method: "PUT",
      })
      toast.success(banner.isActive ? "배너가 비활성화되었습니다" : "배너가 활성화되었습니다")
      fetchBanners()
    } catch (error) {
      console.error("Error toggling banner:", error)
      toast.error("배너 상태 변경에 실패했습니다")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 배너를 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/admin/banners/${id}`, {
        auth: true,
        method: "DELETE",
        parseResponse: "none",
      })
      toast.success("배너가 삭제되었습니다")
      fetchBanners()
    } catch (error) {
      console.error("Error deleting banner:", error)
      toast.error("배너 삭제에 실패했습니다")
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">배너 관리</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          배너 추가
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">등록된 배너가 없습니다</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순서</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>링크 URL</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>{banner.displayOrder}</TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell>{banner.description?.substring(0, 50) || "-"}</TableCell>
                <TableCell>{banner.linkUrl || "-"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      banner.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {banner.isActive ? "활성" : "비활성"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(banner)}
                      title={banner.isActive ? "비활성화" : "활성화"}
                    >
                      {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(banner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(banner.id)}>
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
            <DialogTitle>{editingBanner ? "배너 수정" : "배너 추가"}</DialogTitle>
            <DialogDescription>배너 정보를 입력하세요</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="imageFile">이미지 업로드 *</Label>
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

            <div>
              <Label htmlFor="linkUrl">링크 URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl || ""}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="/category/fruits"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backgroundColor">배경색</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor || "#f5f5f5"}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.backgroundColor || ""}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="textColor">텍스트 색</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor || "#000000"}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.textColor || ""}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>활성화</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={uploadingImage}>
                {uploadingImage ? "업로드 중..." : editingBanner ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
