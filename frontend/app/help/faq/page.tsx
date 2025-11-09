'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Faq {
  id: number
  category: string
  question: string
  answer: string
  displayOrder: number
}

const FAQ_CATEGORIES = {
  ALL: "전체",
  ORDER_DELIVERY: "주문/배송",
  PAYMENT: "결제",
  CANCEL_REFUND: "취소/환불",
  MEMBER: "회원",
  ETC: "기타",
}

function FaqContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'ALL'

  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const data = await apiFetch<Faq[]>("/api/faqs")
      setFaqs(data)
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory
    const matchesSearch = searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">자주 묻는 질문</h1>
            <p className="text-lg opacity-90">
              고객님들이 자주 문의하시는 내용을 확인하세요
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search and Category Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다" : "등록된 FAQ가 없습니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <Card
                  key={faq.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleExpand(faq.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {FAQ_CATEGORIES[faq.category as keyof typeof FAQ_CATEGORIES]}
                          </span>
                        </div>
                        <CardTitle className="text-lg">
                          Q. {faq.question}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(faq.id)
                        }}
                      >
                        {expandedId === faq.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedId === faq.id && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <p className="font-semibold mb-2 text-primary">A.</p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-12 bg-muted rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">찾으시는 답변이 없나요?</h2>
            <p className="text-muted-foreground mb-6">
              1:1 문의를 통해 직접 질문해주세요
            </p>
            <Button asChild>
              <a href="/mypage/inquiries">1:1 문의하기</a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function FaqPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    }>
      <FaqContent />
    </Suspense>
  )
}
