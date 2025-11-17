'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Award } from 'lucide-react'
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
}

export function MdPickSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMdPicks()
  }, [])

  const fetchMdPicks = async () => {
    try {
      const data = await apiFetch<{ content: Product[] }>('/api/products/md-picks?size=10&sort=createdAt,desc')
      setProducts(data.content || [])
    } catch (error) {
      console.error('Error fetching MD picks:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const convertToCardData = (product: Product): ProductCardData => ({
    id: product.id.toString(),
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.discountRate && product.discountRate > 0 ? product.price : undefined,
    image: product.imageUrl || '/placeholder.svg',
    badge: "MD's PICK",
    rating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    hasOptions: product.optionCount > 0,
  })

  if (loading) {
    return (
      <section className="py-16 bg-white">
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

  return (
    <section className="py-16 bg-white border-t">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-6 w-6 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">MD's PICK</h2>
            </div>
            <p className="text-gray-600 mt-1">
              전문가가 엄선한 믿을 수 있는 상품을 만나보세요
            </p>
          </div>
          <Link href="/search?mdPick=true">
            <Button variant="ghost" className="text-sm gap-1">
              전체보기
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...convertToCardData(product)} />
          ))}
        </div>
      </div>
    </section>
  )
}
