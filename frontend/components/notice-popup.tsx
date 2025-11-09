'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { apiFetch, API_BASE_URL } from "@/lib/api-client"

interface Notice {
  id: number
  title: string
  content: string
  imageUrl?: string
  isPopup: boolean
  createdAt: string
}

export function NoticePopup() {
  const [popupNotices, setPopupNotices] = useState<Notice[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchPopupNotices()
  }, [])

  const fetchPopupNotices = async () => {
    try {
      const data = await apiFetch<Notice[]>("/api/notices")
      const popups = data.filter((notice) => notice.isPopup)

      if (popups.length > 0) {
        // Check if user has closed popups today
        const closedToday = localStorage.getItem("popupClosedToday")
        const today = new Date().toDateString()

        if (closedToday !== today) {
          setPopupNotices(popups)
          setOpen(true)
        }
      }
    } catch (error) {
      console.error("Error fetching popup notices:", error)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleCloseTodayOnly = () => {
    const today = new Date().toDateString()
    localStorage.setItem("popupClosedToday", today)
    setOpen(false)
  }

  const handleNext = () => {
    if (currentIndex < popupNotices.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (popupNotices.length === 0) {
    return null
  }

  const currentNotice = popupNotices[currentIndex]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {currentNotice.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(currentNotice.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {currentNotice.imageUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={
                  currentNotice.imageUrl.startsWith('http')
                    ? currentNotice.imageUrl
                    : `${API_BASE_URL}${currentNotice.imageUrl}`
                }
                alt={currentNotice.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{currentNotice.content}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCloseTodayOnly}>
              오늘 하루 보지 않기
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/help/notices">
                모든 공지사항 보기
              </Link>
            </Button>
          </div>

          {popupNotices.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {popupNotices.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === popupNotices.length - 1}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
