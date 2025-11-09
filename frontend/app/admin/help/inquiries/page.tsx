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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, ExternalLink } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Inquiry {
  id: number
  user: {
    id: number
    email: string
    name: string
  }
  category: string
  title: string
  content: string
  attachmentUrl?: string
  status: string
  answer?: string
  answeredAt?: string
  answeredBy?: {
    id: number
    email: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [answer, setAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const data = await apiFetch<Inquiry[]>("/api/admin/inquiries", { auth: true })
      setInquiries(data)
    } catch (error) {
      console.error("Error fetching inquiries:", error)
      toast.error("문의 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setAnswer(inquiry.answer || "")
    setDialogOpen(true)
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedInquiry) return

    if (!answer.trim()) {
      toast.error("답변 내용을 입력해주세요")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch(`/api/admin/inquiries/${selectedInquiry.id}/answer`, {
        auth: true,
        method: "PUT",
        body: JSON.stringify({ answer }),
      })
      toast.success("답변이 등록되었습니다")
      setDialogOpen(false)
      fetchInquiries()
    } catch (error) {
      console.error("Error submitting answer:", error)
      toast.error("답변 등록에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = inquiries.filter(i => i.status === "PENDING").length
  const answeredCount = inquiries.filter(i => i.status === "ANSWERED").length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">1:1 문의 관리</h1>
        <p className="text-muted-foreground mt-1">
          고객 문의를 확인하고 답변을 작성합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">전체 문의</p>
              <p className="text-2xl font-bold">{inquiries.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">답변 대기</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">답변 완료</p>
              <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">등록된 문의가 없습니다</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>카테고리</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {inquiry.category}
                  </span>
                </TableCell>
                <TableCell className="font-medium max-w-md">
                  {inquiry.title}
                </TableCell>
                <TableCell>
                  {inquiry.user.name || inquiry.user.email}
                </TableCell>
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
                    onClick={() => handleOpenDialog(inquiry)}
                  >
                    {inquiry.status === "PENDING" ? "답변하기" : "보기"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
            <DialogDescription>
              {selectedInquiry?.status === "PENDING" ? "답변을 작성하세요" : "문의 내용과 답변을 확인하세요"}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6">
              {/* 문의 정보 */}
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
                  <p className="text-sm text-muted-foreground mb-1">작성자</p>
                  <p className="font-medium">
                    {selectedInquiry.user.name || selectedInquiry.user.email}
                  </p>
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
                      href={selectedInquiry.attachmentUrl.startsWith('http')
                        ? selectedInquiry.attachmentUrl
                        : `${API_BASE_URL}${selectedInquiry.attachmentUrl}`}
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

              {/* 답변 */}
              {selectedInquiry.status === "ANSWERED" && selectedInquiry.answer ? (
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-green-900">답변</p>
                    {selectedInquiry.answeredAt && (
                      <span className="text-sm text-green-700">
                        {new Date(selectedInquiry.answeredAt).toLocaleDateString('ko-KR')}
                        {selectedInquiry.answeredBy && ` • ${selectedInquiry.answeredBy.name || selectedInquiry.answeredBy.email}`}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-green-900">{selectedInquiry.answer}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <div>
                    <Label htmlFor="answer">답변 *</Label>
                    <Textarea
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="고객 문의에 대한 답변을 작성하세요"
                      rows={8}
                      required
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      닫기
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "등록 중..." : "답변 등록"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
