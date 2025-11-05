"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Heart } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

interface WishlistItem {
  id: number
  product: {
    id: number
    name: string
    price: number
    discountRate: number | null
    discountedPrice: number
    stock: number
    imageUrl: string
    category: string
    averageRating?: number
    reviewCount?: number
    options?: any[]
  }
  createdAt: string
}

export default function WishlistPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<WishlistItem[]>("/api/wishlist", { auth: true })
      setWishlist(data)
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "찜 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      setWishlist(wishlist.filter((item) => item.product.id !== productId))
      toast({
        title: "찜 취소",
        description: "찜 목록에서 제거되었습니다.",
      })
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "찜 목록에서 제거하는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">찜한 상품</h1>
            <p className="text-muted-foreground">총 {wishlist.length}개의 상품</p>
          </div>

          {/* Wishlist Items */}
          {wishlist.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">찜한 상품이 없습니다.</p>
                <Button asChild>
                  <Link href="/">상품 둘러보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {wishlist.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.product.id.toString()}
                  name={item.product.name}
                  price={item.product.discountedPrice}
                  originalPrice={item.product.discountRate && item.product.discountRate > 0 ? item.product.price : undefined}
                  image={item.product.imageUrl || "/placeholder.svg"}
                  badge={item.product.category}
                  rating={item.product.averageRating || 0}
                  reviewCount={item.product.reviewCount || 0}
                  hasOptions={(item.product.options?.length || 0) > 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
