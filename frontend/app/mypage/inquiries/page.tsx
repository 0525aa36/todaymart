'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, ExternalLink, ChevronLeft } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Inquiry {
  id: number
  category: string
  title: string
  content: string
  attachmentUrl?: string
  status: string
  answer?: string
  answeredAt?: string
  createdAt: string
  updatedAt: string
}

const INQUIRY_CATEGORIES = [
  "상품문의",
  "배송문의",
  "결제문의",
  "취소/환불",
  "교환/반품",
  "회원정보",
  "기타",
]

export default function MyInquiriesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [formData, setFormData] = useState({
    category: "상품문의",
    title: "",
    content: "",
    attachmentUrl: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const data = await apiFetch<Inquiry[]>("/api/inquiries", { auth: true })
      setInquiries(data)
    } catch (error) {
      console.error("Error fetching inquiries:", error)
      toast.error("문의 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다")
      return
    }

    setUploadingFile(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, attachmentUrl: data.fileUrl || data.url }))
      toast.success("파일이 업로드되었습니다")
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("파일 업로드에 실패했습니다")
    } finally {
      setUploadingFile(false)
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
      await apiFetch("/api/inquiries", {
        auth: true,
        method: "POST",
        body: JSON.stringify(formData),
      })
      toast.success("문의가 등록되었습니다")
      setCreateDialogOpen(false)
      setFormData({
        category: "상품문의",
        title: "",
        content: "",
        attachmentUrl: "",
      })
      fetchInquiries()
    } catch (error) {
      console.error("Error creating inquiry:", error)
      toast.error("문의 등록에 실패했습니다")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 문의를 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/inquiries/${id}`, {
        auth: true,
        method: "DELETE",
        parseResponse: "none",
      })
      toast.success("문의가 삭제되었습니다")
      fetchInquiries()
    } catch (error) {
      console.error("Error deleting inquiry:", error)
      toast.error("문의 삭제에 실패했습니다")
    }
  }

  const handleViewDetail = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailDialogOpen(true)
  }

  const pendingCount = inquiries.filter((i) => i.status === "PENDING").length
  const answeredCount = inquiries.filter((i) => i.status === "ANSWERED").length

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push("/mypage")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            마이페이지로 돌아가기
          </Button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">1:1 문의</h1>
              <p className="text-muted-foreground mt-1">
                궁금하신 사항을 문의해주세요
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              문의하기
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">전체 문의</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inquiries.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">답변 대기</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">답변 완료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 문의가 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>카테고리</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작성일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow
                        key={inquiry.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetail(inquiry)}
                      >
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {inquiry.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{inquiry.title}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              inquiry.status === "PENDING"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {inquiry.status === "PENDING" ? "답변 대기" : "답변 완료"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(inquiry.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>1:1 문의하기</DialogTitle>
            <DialogDescription>문의 내용을 자세히 작성해주세요</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="문의 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="문의 내용을 자세히 입력하세요"
                rows={8}
                required
              />
            </div>

            <div>
              <Label htmlFor="file">파일 첨부 (선택)</Label>
              <div className="space-y-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                {uploadingFile && <p className="text-sm text-muted-foreground">업로드 중...</p>}
                {formData.attachmentUrl && (
                  <p className="text-sm text-green-600">✓ 파일이 업로드되었습니다</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={uploadingFile}>
                {uploadingFile ? "업로드 중..." : "문의 등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {selectedInquiry.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        selectedInquiry.status === "PENDING"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedInquiry.status === "PENDING" ? "답변 대기" : "답변 완료"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedInquiry.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">제목</p>
                  <p className="font-medium text-lg">{selectedInquiry.title}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">내용</p>
                  <p className="whitespace-pre-wrap">{selectedInquiry.content}</p>
                </div>

                {selectedInquiry.attachmentUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">첨부 파일</p>
                    <a
                      href={
                        selectedInquiry.attachmentUrl.startsWith('http')
                          ? selectedInquiry.attachmentUrl
                          : `${API_BASE_URL}${selectedInquiry.attachmentUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      첨부 파일 보기
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {selectedInquiry.answer && (
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-green-900">답변</p>
                    {selectedInquiry.answeredAt && (
                      <span className="text-sm text-green-700">
                        {new Date(selectedInquiry.answeredAt).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-green-900">{selectedInquiry.answer}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
