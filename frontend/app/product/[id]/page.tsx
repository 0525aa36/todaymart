"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ShoppingCart, Heart, Share2, Minus, Plus, Star, Truck, Shield, RefreshCw } from "lucide-react"
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client"

interface Product {
  id: number
  name: string
  category: string
  origin: string
  description: string
  price: number
  stock: number
  imageUrl: string
  createdAt: string
  updatedAt: string
}

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

interface ReviewStats {
  averageRating: number
  reviewCount: number
}

interface ProductOption {
  id: number
  optionName: string
  optionValue: string
  additionalPrice: number
  stock: number
  isAvailable: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState("")
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null)

  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewContent, setReviewContent] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchProductOptions()
      fetchReviews()
      fetchReviewStats()
      checkWishlistStatus()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const data = await apiFetch<Product>(`/api/products/${productId}`)
      setProduct(data)
      setMainImage(data.imageUrl)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        toast({
          title: "오류",
          description: "상품을 찾을 수 없습니다.",
          variant: "destructive",
        })
        router.push("/")
      } else {
        console.error("Error fetching product:", error)
        toast({
          title: "오류",
          description: getErrorMessage(error, "상품 정보를 불러오는 중 오류가 발생했습니다."),
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProductOptions = async () => {
    try {
      const data = await apiFetch<ProductOption[]>(`/api/products/${productId}/options`)
      setProductOptions(data)
    } catch (error) {
      console.error("Error fetching product options:", error)
    }
  }

  const fetchReviews = async () => {
    try {
      const data = await apiFetch<{ content?: Review[] }>(
        `/api/reviews/product/${productId}?size=10&sort=createdAt,desc`,
      )
      setReviews(data.content || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const fetchReviewStats = async () => {
    try {
      const data = await apiFetch<ReviewStats>(`/api/reviews/product/${productId}/stats`)
      setReviewStats(data)
    } catch (error) {
      console.error("Error fetching review stats:", error)
    }
  }

  const addToCart = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "장바구니에 담으려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // 옵션이 있는 상품인데 옵션을 선택하지 않은 경우
    if (productOptions.length > 0 && !selectedOption) {
      toast({
        title: "옵션 선택 필요",
        description: "상품 옵션을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      await apiFetch("/api/cart/items", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          productId: Number(productId),
          quantity: quantity,
          productOptionId: selectedOption?.id || null,
        }),
        parseResponse: "none",
      })

      toast({
        title: "장바구니 추가",
        description: "상품이 장바구니에 추가되었습니다.",
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "장바구니에 추가하는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const buyNow = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "구매하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // 옵션이 있는 상품인데 옵션을 선택하지 않은 경우
    if (productOptions.length > 0 && !selectedOption) {
      toast({
        title: "옵션 선택 필요",
        description: "상품 옵션을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    // 장바구니에 추가 후 결제 페이지로 이동
    try {
      await apiFetch("/api/cart/items", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          productId: Number(productId),
          quantity: quantity,
          productOptionId: selectedOption?.id || null,
        }),
        parseResponse: "none",
      })

      toast({
        title: "장바구니에 추가됨",
        description: "결제 페이지로 이동합니다.",
      })
      router.push("/checkout")
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
        return
      }
      console.error("Error in buy now:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "구매 처리 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const checkWishlistStatus = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const isWishlisted = await apiFetch<boolean>(`/api/wishlist/check/${productId}`, { auth: true })
      setIsInWishlist(isWishlisted)
    } catch (error) {
      console.error("Error checking wishlist status:", error)
    }
  }

  const toggleWishlist = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "찜하기를 사용하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      if (isInWishlist) {
        await apiFetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
          auth: true,
          parseResponse: "none",
        })

        setIsInWishlist(false)
        toast({
          title: "찜 취소",
          description: "찜 목록에서 제거되었습니다.",
        })
      } else {
        await apiFetch("/api/wishlist", {
          method: "POST",
          auth: true,
          body: JSON.stringify({ productId: Number(productId) }),
          parseResponse: "none",
        })

        setIsInWishlist(true)
        toast({
          title: "찜 완료",
          description: "찜 목록에 추가되었습니다.",
        })
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "찜하기 처리 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const submitReview = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "리뷰를 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!reviewTitle.trim() || !reviewContent.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setSubmittingReview(true)
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          productId: Number(productId),
          rating: reviewRating,
          title: reviewTitle,
          content: reviewContent,
        }),
        parseResponse: "none",
      })

      toast({
        title: "리뷰 작성 완료",
        description: "리뷰가 성공적으로 등록되었습니다.",
      })
      setReviewDialogOpen(false)
      setReviewTitle("")
      setReviewContent("")
      setReviewRating(5)
      fetchReviews()
      fetchReviewStats()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "리뷰 작성 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setSubmittingReview(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <p className="text-center">로딩 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Product Info Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Images */}
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                <Image
                  src={mainImage || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-4">
                <Badge className="mb-2" variant="secondary">
                  {product.origin}
                </Badge>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-muted-foreground mb-4">
                  {product.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(reviewStats.averageRating) ? "fill-accent text-accent" : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{reviewStats.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviewStats.reviewCount}개 리뷰)</span>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold">{product.price.toLocaleString()}원</span>
                </div>
                <div className="text-sm text-muted-foreground">재고: {product.stock}개</div>
              </div>

              <Separator className="my-6" />

              {/* Product Options */}
              {productOptions.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="mb-3 block">옵션 선택</Label>
                    <Select
                      value={selectedOption?.id.toString()}
                      onValueChange={(value) => {
                        const option = productOptions.find((opt) => opt.id.toString() === value)
                        setSelectedOption(option || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="옵션을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {productOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.optionValue}
                            {option.additionalPrice !== 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({option.additionalPrice > 0 ? "+" : ""}
                                {option.additionalPrice.toLocaleString()}원)
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">
                              (재고: {option.stock}개)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="mb-3 block">수량</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input type="number" value={quantity} readOnly className="w-20 text-center" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min((selectedOption?.stock || product.stock), quantity + 1))}
                      disabled={quantity >= (selectedOption?.stock || product.stock)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Total Price */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">총 상품 금액</span>
                  <span className="text-2xl font-bold text-primary">
                    {((product.price + (selectedOption?.additionalPrice || 0)) * quantity).toLocaleString()}원
                  </span>
                </div>
                {selectedOption && selectedOption.additionalPrice !== 0 && (
                  <div className="text-sm text-muted-foreground mt-2">
                    기본가: {product.price.toLocaleString()}원 + 옵션: {selectedOption.additionalPrice.toLocaleString()}원
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  className={isInWishlist ? "bg-primary text-primary-foreground" : "bg-transparent"}
                  onClick={toggleWishlist}
                  title={isInWishlist ? "찜 취소" : "찜하기"}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" className="bg-transparent">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={addToCart}>
                  장바구니
                </Button>
                <Button className="flex-1" onClick={buyNow}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  바로구매
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>배송비 3,000원 (3만원 이상 무료배송)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>신선도 보장 - 불만족 시 100% 환불</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>수령 후 7일 이내 교환/반품 가능</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="detail" className="mb-12">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="detail"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                상품상세
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                리뷰 ({reviewStats.reviewCount})
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                배송/교환/반품
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detail" className="mt-8">
              <div className="prose max-w-none">
                <div className="bg-muted/30 rounded-lg p-8 mb-6">
                  <h3 className="text-xl font-bold mb-4">상품 정보</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-24">카테고리</span>
                      <span>{product.category}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">원산지</span>
                      <span>{product.origin}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">재고</span>
                      <span>{product.stock}개</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">보관방법</span>
                      <span>냉장보관</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">상품 설명</h3>
                  <div
                    className="leading-relaxed [&_img]:mx-auto [&_img]:block [&_img]:my-4"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="review" className="mt-8">
              <div className="mb-8">
                <div className="flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{reviewStats.averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(reviewStats.averageRating) ? "fill-accent text-accent" : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">{reviewStats.reviewCount}개 리뷰</div>
                  </div>
                  <div className="flex-1">
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>리뷰 작성하기</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                          <DialogTitle>리뷰 작성</DialogTitle>
                          <DialogDescription>{product.name}에 대한 리뷰를 작성해주세요.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="rating" className="mb-2 block">
                              평점
                            </Label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-8 w-8 ${
                                      star <= reviewRating ? "fill-accent text-accent" : "text-muted"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="title">제목</Label>
                            <Input
                              id="title"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="리뷰 제목을 입력하세요"
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <Label htmlFor="content">내용</Label>
                            <Textarea
                              id="content"
                              value={reviewContent}
                              onChange={(e) => setReviewContent(e.target.value)}
                              placeholder="리뷰 내용을 입력하세요"
                              rows={5}
                              maxLength={1000}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            취소
                          </Button>
                          <Button onClick={submitReview} disabled={submittingReview}>
                            {submittingReview ? "작성 중..." : "작성 완료"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-muted-foreground">
                        아직 작성된 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
                      </CardContent>
                    </Card>
                  ) : (
                    reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{review.userName}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</div>
                            </div>
                          </div>
                          <h4 className="font-semibold mb-2">{review.title}</h4>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-3">배송 안내</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <li>• 배송비: 3,000원 (3만원 이상 구매 시 무료배송)</li>
                    <li>• 배송 방법: 새벽배송, 택배배송 선택 가능</li>
                    <li>• 배송 기간: 주문 후 1-2일 이내 배송</li>
                    <li>• 제주/도서산간 지역은 추가 배송비가 발생할 수 있습니다</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-bold mb-3">교환/반품 안내</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <li>• 신선식품 특성상 단순 변심에 의한 교환/반품은 어렵습니다</li>
                    <li>• 상품 불량, 오배송의 경우 수령 후 24시간 이내 연락 주시면 교환/환불 가능합니다</li>
                    <li>• 교환/반품 배송비는 판매자 부담입니다</li>
                    <li>• 고객센터: 1588-0000 (평일 09:00-18:00)</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
