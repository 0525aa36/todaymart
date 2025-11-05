"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

interface Review {
  id: number
  productId: number
  productName: string
  userId: number
  userName: string
  rating: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function MyReviewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: "",
    content: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<{ content?: Review[] }>("/api/reviews/my-reviews?size=100&sort=createdAt,desc", {
        auth: true,
      })
      setReviews(data.content || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "리뷰 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (review: Review) => {
    setSelectedReview(review)
    setEditForm({
      rating: review.rating,
      title: review.title,
      content: review.content,
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedReview) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/reviews/${selectedReview.id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          productId: selectedReview.productId,
          rating: editForm.rating,
          title: editForm.title,
          content: editForm.content,
        }),
        parseResponse: "none",
      })

      toast({
        title: "리뷰 수정 완료",
        description: "리뷰가 성공적으로 수정되었습니다.",
      })
      setEditDialogOpen(false)
      fetchReviews()
    } catch (error) {
      console.error("Error updating review:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "리뷰 수정 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedReview) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/reviews/${selectedReview.id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "리뷰 삭제 완료",
        description: "리뷰가 성공적으로 삭제되었습니다.",
      })
      setDeleteDialogOpen(false)
      fetchReviews()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "리뷰 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-center">로딩 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">내 리뷰</h1>
            <p className="text-muted-foreground">총 {reviews.length}개의 리뷰</p>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">작성한 리뷰가 없습니다.</p>
                <Button asChild>
                  <Link href="/">상품 둘러보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Link href={`/product/${review.productId}`} className="flex-1">
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {review.productName}
                        </h3>
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(review)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(review)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{review.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>리뷰 수정</DialogTitle>
            <DialogDescription>리뷰를 수정하고 저장하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>평점</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      star <= editForm.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                    }`}
                    onClick={() => setEditForm({ ...editForm, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-title">제목</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="리뷰 제목을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">내용</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="리뷰 내용을 입력하세요"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditSubmit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>리뷰 삭제</DialogTitle>
            <DialogDescription>정말로 이 리뷰를 삭제하시겠습니까?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
