"use client"

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">배너 관리</h1>
          <p className="text-sm text-gray-500 mt-1">등록된 배너를 관리하고 새 배너를 추가하세요</p>
        </div>

        <Link href="/admin/banners/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            배너 등록
          </Button>
        </Link>
      </div>

      {/* Banners Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">등록된 배너 ({banners.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 배너가 없습니다. 새 배너를 등록해보세요!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">순서</TableHead>
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
                    <TableCell className="font-medium">{banner.displayOrder}</TableCell>
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
                          size="icon"
                          onClick={() => handleToggleActive(banner)}
                          title={banner.isActive ? "비활성화" : "활성화"}
                        >
                          {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link href={`/admin/banners/${banner.id}/edit`}>
                          <Button variant="ghost" size="icon" title="수정">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(banner.id)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
