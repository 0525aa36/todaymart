"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/loading-spinner"
import Image from "next/image"
import { toast } from "sonner"

interface ProductOption {
  id: number
  name: string
  optionName?: string
  optionValue?: string
  additionalPrice: number
}

interface Product {
  id: number
  name: string
  price: number
  discountedPrice: number
  discountRate: number | null
  imageUrl: string
  options: ProductOption[]
  stock: number
  stockStatus: "SOLD_OUT" | "LOW_STOCK" | "IN_STOCK"
}

interface AddToCartModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string, quantity: number, optionId?: number) => Promise<void>
}

export function AddToCartModal({ productId, isOpen, onClose, onAddToCart }: AddToCartModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptionId, setSelectedOptionId] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct()
    }
  }, [isOpen, productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<Product>(`/api/products/${productId}`)
      console.log("Product data:", data)
      console.log("Product options:", data.options)
      setProduct(data)
      setQuantity(1)
      setSelectedOptionId(undefined)
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const maxStock = product?.stock || 999
    const newQuantity = prev => {
      const next = prev + delta

      // 재고 한도 도달 시 알림
      if (next > maxStock) {
        toast.warning(`최대 ${maxStock}개까지만 구매 가능합니다`)
        return prev
      }

      // 최소 수량 1개
      if (next < 1) {
        return 1
      }

      return next
    }

    setQuantity(newQuantity)
  }

  const handleAddToCart = async () => {
    if (product && !addingToCart) {
      try {
        setAddingToCart(true)
        await onAddToCart(productId, quantity, selectedOptionId)
        onClose()
      } catch (error) {
        // 에러는 onAddToCart에서 처리됨
      } finally {
        setAddingToCart(false)
      }
    }
  }

  const selectedOption = product?.options?.find(opt => opt.id === selectedOptionId)
  const totalPrice = product ? (product.discountedPrice + (selectedOption?.additionalPrice || 0)) * quantity : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>장바구니에 담기</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">상품 정보를 불러오는 중...</p>
          </div>
        ) : product ? (
          <div className="space-y-4">
            {/* 상품 정보 */}
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                {product.discountRate && product.discountRate > 0 && (
                  <div className="text-sm text-gray-400 line-through">{product.price.toLocaleString()}원</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {product.discountRate && product.discountRate > 0 && (
                    <span className="text-lg font-bold text-orange-500">{product.discountRate}%</span>
                  )}
                  <p className="text-lg font-bold">{product.discountedPrice.toLocaleString()}원</p>
                </div>
              </div>
            </div>

            {/* 옵션 선택 */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-2">
                <Label>옵션 선택</Label>
                <Select value={selectedOptionId?.toString()} onValueChange={(value) => setSelectedOptionId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="옵션을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.options.map((option) => {
                      const displayText = option.optionName && option.optionValue
                        ? `${option.optionName}: ${option.optionValue}`
                        : option.name
                      return (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          {displayText}
                          {option.additionalPrice > 0 && ` (+${option.additionalPrice.toLocaleString()}원)`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 재고 상태 */}
            {product.stockStatus === "SOLD_OUT" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 font-semibold text-center text-sm">현재 품절되었습니다</p>
                <p className="text-red-500 text-xs text-center mt-1">빠른 시일 내에 재입고 예정입니다</p>
              </div>
            ) : product.stock <= 10 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-600 font-semibold text-center text-sm">품절임박</p>
                <p className="text-orange-500 text-xs text-center mt-1">
                  서둘러 주문하세요! (재고 {product.stock}개)
                </p>
              </div>
            )}

            {/* 수량 선택 */}
            <div className="space-y-2">
              <Label>수량</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || product.stockStatus === "SOLD_OUT"}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock || product.stockStatus === "SOLD_OUT"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 총 가격 */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 가격</span>
                <span className="text-xl font-bold text-primary">{totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={addingToCart}>
                취소
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
                disabled={
                  addingToCart ||
                  product.stockStatus === "SOLD_OUT" ||
                  (product.options && product.options.length > 0 && !selectedOptionId)
                }
              >
                {addingToCart ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    담는 중...
                  </>
                ) : product.stockStatus === "SOLD_OUT" ? (
                  "품절"
                ) : (
                  "장바구니 담기"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">상품을 불러올 수 없습니다.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
