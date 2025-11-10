"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage, API_BASE_URL } from "@/lib/api-client"

export default function NewBannerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드 가능합니다",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 5MB 이하여야 합니다",
        variant: "destructive",
      })
      return
    }

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
      toast({
        title: "업로드 성공",
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

    if (!formData.title) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    if (!formData.imageUrl) {
      toast({
        title: "입력 오류",
        description: "이미지를 업로드해주세요",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await apiFetch("/api/admin/banners", {
        method: "POST",
        auth: true,
        body: JSON.stringify(formData),
      })

      toast({
        title: "배너 등록 성공",
        description: "배너가 성공적으로 등록되었습니다.",
      })

      router.push("/admin/banners")
    } catch (error) {
      console.error("Error creating banner:", error)
      toast({
        title: "등록 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/banners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            배너 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>배너 등록</CardTitle>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl">링크 URL</Label>
                <Input
                  id="linkUrl"
                  placeholder="/category/fruits"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">이미지</h3>

              <div className="space-y-2">
                <Label htmlFor="imageFile">이미지 업로드 *</Label>
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
                    <p className="text-sm text-green-600">이미지가 업로드되었습니다</p>
                    <img
                      src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${API_BASE_URL}${formData.imageUrl}`}
                      alt="Preview"
                      className="max-w-xs h-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 디자인 설정 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">디자인 설정</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">배경색</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">텍스트 색</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 표시 설정 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">표시 설정</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">표시 순서</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">활성화 상태</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/banners">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading || uploadingImage}>
                {loading ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
