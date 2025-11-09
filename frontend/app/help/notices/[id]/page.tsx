'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Pin, Eye, Calendar } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Notice {
  id: number
  title: string
  content: string
  imageUrl?: string
  isPinned: boolean
  isPopup: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export default function NoticeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchNotice()
    }
  }, [id])

  const fetchNotice = async () => {
    try {
      const data = await apiFetch<Notice>(`/api/notices/${id}`)
      setNotice(data)
    } catch (error) {
      console.error("Error fetching notice:", error)
      alert("공지사항을 불러오지 못했습니다")
      router.push("/help/notices")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notice ? (
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 flex items-center gap-1">
                        <Pin className="h-3 w-3" />
                        고정
                      </span>
                    )}
                    {notice.isPopup && (
                      <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        팝업
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-2xl">
                    {notice.title}
                  </CardTitle>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      조회수 {notice.viewCount}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {notice.imageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={notice.imageUrl.startsWith('http')
                        ? notice.imageUrl
                        : `${API_BASE_URL}${notice.imageUrl}`}
                      alt={notice.title}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">
                    {notice.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">공지사항을 찾을 수 없습니다</p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/help/notices">목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
