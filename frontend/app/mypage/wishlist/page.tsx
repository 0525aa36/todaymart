"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Heart, ShoppingCart, X } from "lucide-react"

interface WishlistItem {
  id: number
  product: {
    id: number
    name: string
    price: number
    stock: number
    imageUrl: string
    category: string
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
      const response = await fetch("http://localhost:8081/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setWishlist(data)
      } else {
        throw new Error("Failed to fetch wishlist")
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      toast({
        title: "오류",
        description: "찜 목록을 불러오는 중 오류가 발생했습니다.",
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
      const response = await fetch(`http://localhost:8081/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setWishlist(wishlist.filter((item) => item.product.id !== productId))
        toast({
          title: "찜 취소",
          description: "찜 목록에서 제거되었습니다.",
        })
      } else {
        throw new Error("Failed to remove from wishlist")
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast({
        title: "오류",
        description: "찜 목록에서 제거하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const addToCart = async (productId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch("http://localhost:8081/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productId,
          quantity: 1,
        }),
      })

      if (response.ok) {
        toast({
          title: "장바구니 추가",
          description: "상품이 장바구니에 추가되었습니다.",
        })
      } else {
        throw new Error("Failed to add to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "오류",
        description: "장바구니에 추가하는 중 오류가 발생했습니다.",
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <Link href={`/product/${item.product.id}`}>
                      <Image
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </Link>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeFromWishlist(item.product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/product/${item.product.id}`}>
                      <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-primary">
                        {item.product.price.toLocaleString()}원
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      찜한 날짜: {formatDate(item.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => addToCart(item.product.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        담기
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/product/${item.product.id}`}>보기</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
