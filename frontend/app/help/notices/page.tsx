'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pin, Eye } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
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
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const data = await apiFetch<Notice[]>("/api/notices")
      setNotices(data)
    } catch (error) {
      console.error("Error fetching notices:", error)
    } finally {
      setLoading(false)
    }
  }

  const pinnedNotices = notices.filter(n => n.isPinned)
  const regularNotices = notices.filter(n => !n.isPinned)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">공지사항</h1>
            <p className="text-lg opacity-90">
              오늘마트의 새로운 소식과 중요한 안내사항을 확인하세요
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 공지사항이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Notices */}
              {pinnedNotices.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Pin className="h-5 w-5 text-orange-600" />
                    고정 공지사항
                  </h2>
                  <div className="space-y-2">
                    {pinnedNotices.map((notice) => (
                      <Link key={notice.id} href={`/help/notices/${notice.id}`}>
                        <Card className="hover:shadow-md transition-shadow bg-orange-50 border-orange-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Pin className="h-4 w-4 text-orange-600 shrink-0" />
                                  {notice.title}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {notice.viewCount}
                                </span>
                                <span>{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Notices */}
              {regularNotices.length > 0 && (
                <div>
                  {pinnedNotices.length > 0 && (
                    <h2 className="text-lg font-semibold mb-3">일반 공지사항</h2>
                  )}
                  <div className="space-y-2">
                    {regularNotices.map((notice) => (
                      <Link key={notice.id} href={`/help/notices/${notice.id}`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {notice.title}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {notice.viewCount}
                                </span>
                                <span>{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
