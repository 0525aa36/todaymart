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

  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItem | null
    if (tab && ['notices', 'faq', 'inquiries'].includes(tab)) {
      setActiveMenu(tab)
    }
  }, [searchParams])

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
    } catch (error) {
      console.error("Error creating inquiry:", error)
      toast.error("문의 등록에 실패했습니다")
    }
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
                    <div className="p-12 text-center text-muted-foreground">
                      게시글이 없습니다.
                    </div>
                  </div>
                </div>
              )}

              {activeMenu === 'faq' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-primary">자주하는 질문</h2>
                  <div className="border border-primary/20 rounded-lg">
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/20 flex items-center">
                      <div className="flex-1 text-center font-semibold">제목</div>
                      <div className="w-32 text-center font-semibold">카테고리</div>
                    </div>
                    <div className="p-12 text-center text-muted-foreground">
                      게시글이 없습니다.
                    </div>
                  </div>
                </div>
              )}

              {activeMenu === 'inquiries' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-primary">1:1 문의</h2>

                  <div className="bg-white border border-primary/20 rounded-lg p-6">
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

                      <div className="flex justify-end">
                        <Button type="submit" disabled={uploadingFile} className="bg-accent text-accent-foreground hover:bg-accent/90">
                          {uploadingFile ? "업로드 중..." : "문의 등록"}
                        </Button>
                      </div>
                    </form>
                  </div>
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
