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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Faq {
  id: number
  category: string
  question: string
  answer: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const FAQ_CATEGORIES = {
  ORDER_DELIVERY: "주문/배송",
  PAYMENT: "결제",
  CANCEL_REFUND: "취소/환불",
  MEMBER: "회원",
  ETC: "기타",
}

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("ALL")
  const [formData, setFormData] = useState({
    category: "ORDER_DELIVERY",
    question: "",
    answer: "",
    displayOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const data = await apiFetch<Faq[]>("/api/admin/faqs", { auth: true })
      setFaqs(data)
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      toast.error("FAQ 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq)
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        displayOrder: faq.displayOrder,
        isActive: faq.isActive,
      })
    } else {
      setEditingFaq(null)
      setFormData({
        category: "ORDER_DELIVERY",
        question: "",
        answer: "",
        displayOrder: 0,
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question.trim()) {
      toast.error("질문을 입력해주세요")
      return
    }

    if (!formData.answer.trim()) {
      toast.error("답변을 입력해주세요")
      return
    }

    try {
      if (editingFaq) {
        await apiFetch(`/api/admin/faqs/${editingFaq.id}`, {
          auth: true,
          method: "PUT",
          body: JSON.stringify(formData),
        })
        toast.success("FAQ가 수정되었습니다")
      } else {
        await apiFetch("/api/admin/faqs", {
          auth: true,
          method: "POST",
          body: JSON.stringify(formData),
        })
        toast.success("FAQ가 생성되었습니다")
      }

      setDialogOpen(false)
      fetchFaqs()
    } catch (error) {
      console.error("Error saving FAQ:", error)
      toast.error("FAQ 저장에 실패했습니다")
    }
  }

  const handleToggleActive = async (faq: Faq) => {
    try {
      await apiFetch(`/api/admin/faqs/${faq.id}/toggle`, {
        auth: true,
        method: "PUT",
      })
      toast.success(faq.isActive ? "FAQ가 비활성화되었습니다" : "FAQ가 활성화되었습니다")
      fetchFaqs()
    } catch (error) {
      console.error("Error toggling FAQ:", error)
      toast.error("FAQ 상태 변경에 실패했습니다")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 FAQ를 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/admin/faqs/${id}`, {
        auth: true,
        method: "DELETE",
        parseResponse: "none",
      })
      toast.success("FAQ가 삭제되었습니다")
      fetchFaqs()
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      toast.error("FAQ 삭제에 실패했습니다")
    }
  }

  const filteredFaqs = filterCategory === "ALL"
    ? faqs
    : faqs.filter(faq => faq.category === filterCategory)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ 관리</h1>
          <p className="text-muted-foreground mt-1">
            자주 묻는 질문을 카테고리별로 관리합니다
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          FAQ 추가
        </Button>
      </div>

      <div className="mb-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 카테고리</SelectItem>
            {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {filterCategory === "ALL" ? "등록된 FAQ가 없습니다" : "해당 카테고리의 FAQ가 없습니다"}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순서</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>질문</TableHead>
              <TableHead>답변</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFaqs.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell>{faq.displayOrder}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {FAQ_CATEGORIES[faq.category as keyof typeof FAQ_CATEGORIES]}
                  </span>
                </TableCell>
                <TableCell className="font-medium max-w-md">
                  {faq.question.substring(0, 50)}
                  {faq.question.length > 50 && "..."}
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  {faq.answer.substring(0, 50)}
                  {faq.answer.length > 50 && "..."}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      faq.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {faq.isActive ? "활성" : "비활성"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(faq)}
                      title={faq.isActive ? "비활성화" : "활성화"}
                    >
                      {faq.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(faq)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(faq.id)}>
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
            <DialogTitle>{editingFaq ? "FAQ 수정" : "FAQ 추가"}</DialogTitle>
            <DialogDescription>FAQ 정보를 입력하세요</DialogDescription>
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
                  {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question">질문 *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="예: 주문 후 배송까지 얼마나 걸리나요?"
                required
              />
            </div>

            <div>
              <Label htmlFor="answer">답변 *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="질문에 대한 답변을 입력하세요"
                rows={6}
                required
              />
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
              <Button type="submit">
                {editingFaq ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
