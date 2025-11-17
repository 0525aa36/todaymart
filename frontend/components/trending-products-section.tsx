'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from './loading-spinner'

interface Product {
  id: number
  name: string
  price: number
  discountedPrice: number
  imageUrl: string
  category: string
  averageRating: number
  reviewCount: number
  optionCount: number
  discountRate: number | null
}

interface ProductCardData {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  rating?: number
  reviewCount?: number
  hasOptions?: boolean
  rank?: number
}

export function TrendingProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0) // 0: 1~5위, 1: 6~10위

  useEffect(() => {
    fetchTrendingProducts()
  }, [])

  const fetchTrendingProducts = async () => {
    try {
      const data = await apiFetch<{ content: Product[] }>('/api/products/trending?size=10&sort=createdAt,desc')
      setProducts(data.content || [])
    } catch (error) {
      console.error('Error fetching trending products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const convertToCardData = (product: Product, rank: number): ProductCardData => ({
    id: product.id.toString(),
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.discountRate && product.discountRate > 0 ? product.price : undefined,
    image: product.imageUrl || '/placeholder.svg',
    badge: undefined, // 뱃지 제거
    rating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    hasOptions: product.optionCount > 0,
    rank: rank,
  })

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  const startIndex = currentPage * 5
  const displayedProducts = products.slice(startIndex, startIndex + 5)
  const actualRankStart = startIndex + 1

  return (
    <section className="py-12 bg-white border-t overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-bold text-gray-900">실시간 인기 랭킹</h2>
            <span className="text-3xl">🏆</span>
          </div>
          <p className="text-sm text-gray-600">
            지금 인기있는 상품만 모아보세요
          </p>
        </div>

        {/* 상품 그리드 with 화살표 */}
        <div className="relative px-8 md:px-12">
          {/* 왼쪽 화살표 */}
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="hidden md:flex absolute left-0 top-1/3 -translate-y-1/2 z-20 bg-white rounded-full p-2.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors items-center justify-center"
              aria-label="이전 5개"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
          )}

          {/* 상품 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6">
            {displayedProducts.map((product, index) => {
              const actualRank = actualRankStart + index
              return (
                <div key={product.id} className="relative group">
                  {/* 순위 표시 - 미니멀한 디자인 */}
                  <div className={`absolute -top-3 -left-3 z-10 px-3 py-1 rounded-br-lg font-bold shadow-sm ${
                    actualRank === 1 ? 'bg-yellow-400 text-white text-lg' :
                    actualRank === 2 ? 'bg-gray-400 text-white text-base' :
                    actualRank === 3 ? 'bg-orange-400 text-white text-base' :
                    'bg-white text-gray-700 text-sm border border-gray-200'
                  }`}>
                    {actualRank}
                  </div>
                  <ProductCard {...convertToCardData(product, actualRank)} />
                </div>
              )
            })}
          </div>

          {/* 오른쪽 화살표 */}
          {products.length > 5 && currentPage === 0 && (
            <button
              onClick={() => setCurrentPage(1)}
              className="hidden md:flex absolute right-0 top-1/3 -translate-y-1/2 z-20 bg-white rounded-full p-2.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors items-center justify-center"
              aria-label="다음 5개"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </div>

        {/* 모바일용 페이지 인디케이터 */}
        {products.length > 5 && (
          <div className="flex md:hidden justify-center gap-2 mb-4">
            <button
              onClick={() => setCurrentPage(0)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentPage === 0 ? 'bg-blue-600 w-8' : 'bg-gray-300'
              }`}
              aria-label="1-5위 보기"
            />
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentPage === 1 ? 'bg-blue-600 w-8' : 'bg-gray-300'
              }`}
              aria-label="6-10위 보기"
            />
          </div>
        )}

        {/* 전체보기 버튼 */}
        <div className="flex justify-center">
          <Link href="/search?sort=trending" className="w-full md:w-auto">
            <Button variant="ghost" className="w-full md:w-auto min-w-[200px] gap-1">
              전체보기
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
