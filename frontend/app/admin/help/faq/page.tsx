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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const router = useRouter()
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("ALL")

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
        <Link href="/admin/help/faq/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            FAQ 추가
          </Button>
        </Link>
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
                    <Link href={`/admin/help/faq/${faq.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
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
    </div>
  )
}
