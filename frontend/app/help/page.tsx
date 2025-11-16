'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"

type MenuItem = 'notices' | 'faq' | 'inquiries'

const INQUIRY_CATEGORIES = [
  "상품문의",
  "배송문의",
  "결제문의",
  "취소/환불",
  "교환/반품",
  "회원정보",
  "기타",
]

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

interface Notice {
  id: number
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface FAQ {
  id: number
  category: string
  question: string
  answer: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

function HelpCenterContent() {
  const searchParams = useSearchParams()
  const [activeMenu, setActiveMenu] = useState<MenuItem>('notices')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [formData, setFormData] = useState({
    category: "상품문의",
    title: "",
    content: "",
    attachmentUrl: "",
  })
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loadingInquiries, setLoadingInquiries] = useState(false)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItem | null
    if (tab && ['notices', 'faq', 'inquiries'].includes(tab)) {
      setActiveMenu(tab)
      if (tab === 'inquiries') {
        fetchInquiries()
      } else if (tab === 'notices') {
        fetchNotices()
      } else if (tab === 'faq') {
        fetchFaqs()
      }
    } else {
      // 기본적으로 공지사항 로드
      fetchNotices()
    }
  }, [searchParams])

  const fetchNotices = async () => {
    try {
      setLoadingNotices(true)
      const data = await apiFetch<Notice[]>("/api/notices")
      setNotices(data)
    } catch (error) {
      console.error("Error fetching notices:", error)
      toast.error("공지사항을 불러오지 못했습니다")
    } finally {
      setLoadingNotices(false)
    }
  }

  const fetchFaqs = async () => {
    try {
      setLoadingFaqs(true)
      const data = await apiFetch<FAQ[]>("/api/faqs")
      setFaqs(data)
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      toast.error("FAQ를 불러오지 못했습니다")
    } finally {
      setLoadingFaqs(false)
    }
  }

  const fetchInquiries = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setInquiries([])
      return
    }

    try {
      setLoadingInquiries(true)
      const data = await apiFetch<Inquiry[]>("/api/inquiries", { auth: true })
      setInquiries(data)
    } catch (error) {
      console.error("Error fetching inquiries:", error)
      toast.error("문의 목록을 불러오지 못했습니다")
    } finally {
      setLoadingInquiries(false)
    }
  }

  const menuItems = [
    { id: 'notices' as MenuItem, label: '공지사항' },
    { id: 'faq' as MenuItem, label: '자주하는 질문' },
    { id: 'inquiries' as MenuItem, label: '1:1 문의' },
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("로그인이 필요합니다")
      return
    }

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
      setFormData({
        category: "상품문의",
        title: "",
        content: "",
        attachmentUrl: "",
      })
      setShowInquiryForm(false)
      fetchInquiries()
    } catch (error) {
      console.error("Error creating inquiry:", error)
      toast.error("문의 등록에 실패했습니다")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <>

      <main className="flex-1">
        {/* 페이지 타이틀 */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 max-w-6xl py-8">
            <h1 className="text-3xl font-bold">고객센터</h1>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex gap-8">
            {/* 좌측 사이드바 */}
            <aside className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeMenu === item.id

                  return (
                    <div
                      key={item.id}
                      className={`
                        flex items-center justify-between px-4 py-4 rounded-lg cursor-pointer transition-all
                        ${isActive
                          ? 'bg-primary/10 border-l-4 border-primary font-semibold text-primary'
                          : 'hover:bg-muted border-l-4 border-transparent text-foreground'
                        }
                      `}
                      onClick={() => setActiveMenu(item.id)}
                    >
                      <div>
                        <div className={isActive ? 'text-primary' : 'text-foreground'}>
                          {item.label}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  )
                })}
              </nav>
            </aside>

            {/* 우측 컨텐츠 영역 */}
            <div className="flex-1">
              {activeMenu === 'notices' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-primary">공지사항</h2>
                  <div className="border border-primary/20 rounded-lg">
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/20 flex items-center">
                      <div className="flex-1 text-center font-semibold">제목</div>
                      <div className="w-32 text-center font-semibold">작성일</div>
                    </div>
                    {loadingNotices ? (
                      <div className="p-12 text-center">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : notices.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        게시글이 없습니다.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notices.map((notice) => (
                          <Link
                            key={notice.id}
                            href={`/help/notices/${notice.id}`}
                            className="flex items-center px-6 py-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 flex items-center gap-2">
                              {notice.isPinned && (
                                <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded">공지</span>
                              )}
                              <span className="font-medium">{notice.title}</span>
                            </div>
                            <div className="w-32 text-center text-sm text-muted-foreground">
                              {formatDate(notice.createdAt)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMenu === 'faq' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-primary">자주하는 질문</h2>
                  <div className="border border-primary/20 rounded-lg">
                    {loadingFaqs ? (
                      <div className="p-12 text-center">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : faqs.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        게시글이 없습니다.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {faqs.map((faq) => (
                          <Link
                            key={faq.id}
                            href={`/help/faq/${faq.id}`}
                            className="block px-6 py-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                    {faq.category}
                                  </span>
                                </div>
                                <h3 className="font-medium">Q. {faq.question}</h3>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMenu === 'inquiries' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">1:1 문의</h2>
                    {!showInquiryForm && (
                      <Button
                        onClick={() => setShowInquiryForm(true)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        새로 문의하기
                      </Button>
                    )}
                  </div>

                  {showInquiryForm ? (
                    <div className="bg-white border border-primary/20 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">새 문의 작성</h3>
                        <Button
                          variant="ghost"
                          onClick={() => setShowInquiryForm(false)}
                          className="text-muted-foreground"
                        >
                          목록으로
                        </Button>
                      </div>
                      <form onSubmit={handleSubmit} className="space-y-6">
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
                              <p className="text-sm text-primary">✓ 파일이 업로드되었습니다</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowInquiryForm(false)}
                          >
                            취소
                          </Button>
                          <Button type="submit" disabled={uploadingFile} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            {uploadingFile ? "업로드 중..." : "문의 등록"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white border border-primary/20 rounded-lg">
                      {loadingInquiries ? (
                        <div className="p-12 text-center">
                          <LoadingSpinner size="lg" />
                        </div>
                      ) : inquiries.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                          아직 문의 내역이 없습니다.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {inquiries.map((inquiry) => (
                            <div
                              key={inquiry.id}
                              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => setSelectedInquiry(inquiry)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                                      {inquiry.category}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      inquiry.status === 'PENDING'
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-primary/10 text-primary'
                                    }`}>
                                      {inquiry.status === 'PENDING' ? '답변 대기' : '답변 완료'}
                                    </span>
                                  </div>
                                  <h3 className="font-medium mb-1">{inquiry.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(inquiry.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedInquiry && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">문의 상세</h3>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedInquiry(null)}
                              className="text-muted-foreground"
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                                  {selectedInquiry.category}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  selectedInquiry.status === 'PENDING'
                                    ? 'bg-accent/10 text-accent'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  {selectedInquiry.status === 'PENDING' ? '답변 대기' : '답변 완료'}
                                </span>
                                <span className="text-sm text-muted-foreground ml-auto">
                                  {formatDate(selectedInquiry.createdAt)}
                                </span>
                              </div>

                              <h4 className="font-semibold text-lg mb-2">{selectedInquiry.title}</h4>
                              <p className="whitespace-pre-wrap text-sm">{selectedInquiry.content}</p>

                              {selectedInquiry.attachmentUrl && (
                                <div className="mt-3">
                                  <a
                                    href={selectedInquiry.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                  >
                                    첨부 파일 보기
                                  </a>
                                </div>
                              )}
                            </div>

                            {selectedInquiry.answer && (
                              <div className="bg-primary/5 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-primary">답변</h5>
                                  {selectedInquiry.answeredAt && (
                                    <span className="text-sm text-muted-foreground">
                                      {formatDate(selectedInquiry.answeredAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="whitespace-pre-wrap text-sm">{selectedInquiry.answer}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">로딩중...</div>}>
        <HelpCenterContent />
      </Suspense>
      <Footer />
    </div>
  )
}
