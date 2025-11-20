"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { apiFetch } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  rating?: number
  reviewCount?: number
  hasOptions?: boolean
  stock?: number
  lowStockThreshold?: number
  stockStatus?: "SOLD_OUT" | "LOW_STOCK" | "IN_STOCK"
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  badge,
  rating,
  reviewCount,
  hasOptions = false,
  stock = 999,
  lowStockThreshold = 10,
  stockStatus = "IN_STOCK",
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(0)
  const router = useRouter()
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  // 장바구니 수량 조회
  const fetchCartQuantity = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setCartQuantity(0)
      return
    }

    try {
      const cart = await apiFetch<{ cartItems: Array<{ product: { id: number }, quantity: number }> }>(
        "/api/cart",
        { auth: true }
      )

      const item = cart.cartItems.find(item => item.product.id === Number(id))
      setCartQuantity(item?.quantity || 0)
    } catch (error) {
      // 401 에러 등은 조용히 처리
      setCartQuantity(0)
    }
  }, [id])

  useEffect(() => {
    fetchCartQuantity()

    // 장바구니 업데이트 이벤트 리스너
    const handleCartUpdate = () => {
      fetchCartQuantity()
    }
    window.addEventListener("cartUpdated", handleCartUpdate)

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
    }
  }, [fetchCartQuantity])

  const handleAddToCart = async (productId: string, quantity: number, optionId?: number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("로그인이 필요합니다")
        router.push("/login")
        return
      }

      const requestBody = {
        productId: Number(productId),
        quantity,
        productOptionId: optionId
      }
      console.log("[ProductCard] Sending to cart API:", requestBody)

      await apiFetch("/api/cart/items", {
        method: "POST",
        auth: true,
        body: JSON.stringify(requestBody)
      })

      toast.success("장바구니에 상품이 추가되었습니다!")

      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("장바구니 추가에 실패했습니다")
    }
  }

  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 로그인 체크
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("로그인이 필요합니다")
      router.push("/login")
      return
    }

    // 모든 상품에 대해 모달 열기 (수량 선택)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="relative bg-card rounded-lg overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-muted group">
          <Link href={`/product/${id}`} className={stockStatus === "SOLD_OUT" ? "pointer-events-none" : ""}>
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${stockStatus === "SOLD_OUT" ? "opacity-50" : ""}`}
              priority={false}
              quality={85}
            />
          </Link>

          {/* 품절 오버레이 */}
          {stockStatus === "SOLD_OUT" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">품절</Badge>
            </div>
          )}

          {/* 재고 상태 배지 */}
          {stockStatus === "LOW_STOCK" && stock <= 5 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white animate-pulse">
              ⏰ 단 {stock}개 남음!
            </Badge>
          )}
          {stockStatus === "LOW_STOCK" && stock > 5 && (
            <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
              ⚡ 품절임박! 서두르세요
            </Badge>
          )}
          {badge && stockStatus !== "LOW_STOCK" && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">{badge}</Badge>
          )}
        </div>

        <div className="pt-3">
          {stockStatus === "SOLD_OUT" ? (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              disabled
            >
              품절
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full transition-colors border-primary text-primary hover:bg-primary hover:text-white hover:border-primary"
              size="sm"
              onClick={handleCartButtonClick}
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              담기
            </Button>
          )}
        </div>

        <div className="py-3">
          <Link href={`/product/${id}`}>
            <h3 className="font-medium text-base mb-2 line-clamp-2 hover:text-primary transition-colors">{name}</h3>
          </Link>

          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <span className="text-accent">★</span>
              <span>{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>
          )}

          <div className="space-y-0.5">
            {originalPrice && (
              <div className="text-sm text-muted-foreground line-through">{originalPrice.toLocaleString()}원</div>
            )}
            <div className="flex items-center gap-2">
              {originalPrice && (
                <span className="text-lg font-bold text-orange-500">{discount}%</span>
              )}
              <span className="text-lg font-bold">{price.toLocaleString()}원{hasOptions ? '~' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <AddToCartModal
        productId={id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </>
  )
}
