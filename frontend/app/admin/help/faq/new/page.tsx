"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

const FAQ_CATEGORIES = {
  ORDER_DELIVERY: "주문/배송",
  PAYMENT: "결제",
  CANCEL_REFUND: "취소/환불",
  MEMBER: "회원",
  ETC: "기타",
}

export default function NewFaqPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    category: "ORDER_DELIVERY",
    question: "",
    answer: "",
    displayOrder: 0,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question.trim()) {
      toast({
        title: "입력 오류",
        description: "질문을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    if (!formData.answer.trim()) {
      toast({
        title: "입력 오류",
        description: "답변을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await apiFetch("/api/admin/faqs", {
        method: "POST",
        auth: true,
        body: JSON.stringify(formData),
      })

      toast({
        title: "FAQ 등록 성공",
        description: "FAQ가 성공적으로 등록되었습니다.",
      })

      router.push("/admin/help/faq")
    } catch (error) {
      console.error("Error creating FAQ:", error)
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
        <Link href="/admin/help/faq">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            FAQ 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              <div className="space-y-2">
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
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">질문 *</Label>
                <Input
                  id="question"
                  required
                  placeholder="예: 주문 후 배송까지 얼마나 걸리나요?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">답변 *</Label>
                <Textarea
                  id="answer"
                  required
                  placeholder="질문에 대한 답변을 입력하세요"
                  rows={8}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                />
              </div>
            </div>

            {/* 표시 설정 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">표시 설정</h3>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">
                  숫자가 작을수록 먼저 표시됩니다
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">활성화 상태</Label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/help/faq">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
