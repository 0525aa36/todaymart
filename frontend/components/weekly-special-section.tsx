'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { ProductCard } from '@/components/product-card'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { Button } from '@/components/ui/button'
import { ChevronRight, Zap, ShoppingCart } from 'lucide-react'
import { LoadingSpinner } from './loading-spinner'
import { AddToCartModal } from '@/components/add-to-cart-modal'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

interface SpecialDeal {
  id: number
  title: string
  description: string
  startTime: string
  endTime: string
  discountRate: number
  isActive: boolean
  bannerImageUrl: string
  backgroundColor: string
  textColor: string
  products: Product[]
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

interface WeeklySpecialSectionProps {
  specialDealId?: number
}

export function WeeklySpecialSection({ specialDealId }: WeeklySpecialSectionProps = {}) {
  const [specialDeals, setSpecialDeals] = useState<SpecialDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchSpecialDeals()
  }, [specialDealId])

  const fetchSpecialDeals = async () => {
    try {
      if (specialDealId) {
        // Fetch specific special deal by ID
        const data = await apiFetch<SpecialDeal>(`/api/special-deals/${specialDealId}`)
        setSpecialDeals([data])
      } else {
        // Fetch all ongoing special deals
        const data = await apiFetch<SpecialDeal[]>('/api/special-deals/ongoing')
        setSpecialDeals(data)
      }
    } catch (error) {
      console.error('Error fetching special deals:', error)
      setSpecialDeals([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string, quantity: number, optionId?: number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("로그인이 필요합니다")
        router.push("/login")
        return
      }

      await apiFetch("/api/cart/items", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          productId: Number(productId),
          quantity,
          optionId
        })
      })

      toast.success("장바구니에 상품이 추가되었습니다!")
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("장바구니 추가에 실패했습니다")
    }
  }

  const handleCartButtonClick = (productId: number) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("로그인이 필요합니다")
      router.push("/login")
      return
    }
    setSelectedProductId(productId.toString())
    setIsModalOpen(true)
  }

  const convertToCardData = (product: Product): ProductCardData => ({
    id: product.id.toString(),
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.discountRate && product.discountRate > 0 ? product.price : undefined,
    image: product.imageUrl || '/placeholder.svg',
    badge: '특가',
    rating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    hasOptions: product.optionCount > 0,
  })

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    )
  }

  if (specialDeals.length === 0) {
    return null
  }

  return (
    <>
      {specialDeals.map((deal) => {
        const productCount = deal.products?.length || 0

        // 1개: 히어로 스타일 (큰 이미지 + 상세 정보)
        if (productCount === 1) {
          const product = deal.products[0]
          return (
            <section key={deal.id} className="py-12 bg-gradient-to-br from-primary-50 to-secondary/10 border-y">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* 왼쪽: 이미지 */}
                  <div className="flex justify-center">
                    <div className="relative group max-w-md w-full">
                      <Link href={`/product/${product.id}`}>
                        <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                          <img
                            src={product.imageUrl || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.discountRate && product.discountRate > 0 && (
                            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                              {product.discountRate}%
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* 오른쪽: 정보 */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900">{deal.title}</h2>
                    </div>
                    {deal.description && (
                      <p className="text-lg text-gray-600">{deal.description}</p>
                    )}
                    <div className="text-primary">
                      <CountdownTimer
                        endTime={deal.endTime}
                        onExpire={() => fetchSpecialDeals()}
                        className="text-3xl font-bold"
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                      <div className="space-y-2">
                        {product.discountRate && product.discountRate > 0 && (
                          <div className="text-lg text-gray-400 line-through">
                            {product.price.toLocaleString()}원
                          </div>
                        )}
                        <div className="flex items-baseline gap-3">
                          {product.discountRate && product.discountRate > 0 && (
                            <span className="text-2xl font-bold text-accent">{product.discountRate}%</span>
                          )}
                          <span className="text-3xl font-bold text-gray-900">
                            {product.discountedPrice.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                      {/* 장바구니 담기 버튼 - 가격 아래로 이동 */}
                      <Button
                        variant="outline"
                        className="min-w-[300px] transition-colors border-primary text-primary hover:bg-primary hover:text-white hover:border-primary text-lg py-5"
                        onClick={() => handleCartButtonClick(product.id)}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        담기
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        }

        // 2개: 나란히 큰 카드
        if (productCount === 2) {
          return (
            <section key={deal.id} className="py-10 bg-gradient-to-br from-primary-50 to-secondary/10 border-y">
              <div className="container mx-auto px-4 max-w-6xl">
                {/* 헤더 */}
                <div className="text-center mb-8">
                  <div className="mb-3">
                    <h2 className="text-3xl font-bold text-gray-900">{deal.title}</h2>
                  </div>
                  {deal.description && (
                    <p className="text-gray-600 mb-3">{deal.description}</p>
                  )}
                  <div className="text-primary">
                    <CountdownTimer
                      endTime={deal.endTime}
                      onExpire={() => fetchSpecialDeals()}
                      className="text-xl font-bold"
                    />
                  </div>
                </div>

                {/* 2개 상품 그리드 */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {deal.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white rounded-xl border-2 hover:border-primary hover:shadow-xl transition-all"
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-80 object-cover rounded-t-xl"
                        />
                        {product.discountRate && product.discountRate > 0 && (
                          <div className="absolute top-3 left-3 bg-accent text-white px-4 py-2 rounded-lg font-bold text-lg">
                            {product.discountRate}%
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                        <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                          {product.name}
                        </h3>
                        <div className="space-y-1">
                          {product.discountRate && product.discountRate > 0 && (
                            <div className="text-base text-gray-400 line-through">
                              {product.price.toLocaleString()}원
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            {product.discountRate && product.discountRate > 0 && (
                              <span className="text-xl font-bold text-accent">{product.discountRate}%</span>
                            )}
                            <span className="text-2xl font-bold text-gray-900">
                              {product.discountedPrice.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )
        }

        // 3개: 1개 큰 + 2개 작은
        if (productCount === 3) {
          return (
            <section key={deal.id} className="py-10 bg-gradient-to-br from-primary-50 to-secondary/10 border-y">
              <div className="container mx-auto px-4 max-w-6xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{deal.title}</h2>
                    </div>
                    {deal.description && (
                      <p className="text-sm text-gray-600">{deal.description}</p>
                    )}
                  </div>
                  <div className="text-primary">
                    <CountdownTimer
                      endTime={deal.endTime}
                      onExpire={() => fetchSpecialDeals()}
                      className="text-lg font-bold"
                    />
                  </div>
                </div>

                {/* 3개 상품 레이아웃 */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* 첫번째 상품 - 크게 */}
                  <Link
                    href={`/product/${deal.products[0].id}`}
                    className="md:col-span-2 bg-white rounded-xl border hover:shadow-2xl transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={deal.products[0].imageUrl || '/placeholder.svg'}
                        alt={deal.products[0].name}
                        className="w-full h-96 object-cover rounded-t-xl"
                      />
                      {deal.products[0].discountRate && deal.products[0].discountRate > 0 && (
                        <div className="absolute top-4 left-4 bg-accent text-white px-5 py-2 rounded-lg font-bold text-xl">
                          {deal.products[0].discountRate}%
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-2">{deal.products[0].category}</p>
                      <h3 className="font-bold text-2xl text-gray-900 mb-3">
                        {deal.products[0].name}
                      </h3>
                      <div className="space-y-1">
                        {deal.products[0].discountRate && deal.products[0].discountRate > 0 && (
                          <div className="text-lg text-gray-400 line-through">
                            {deal.products[0].price.toLocaleString()}원
                          </div>
                        )}
                        <div className="flex items-baseline gap-3">
                          {deal.products[0].discountRate && deal.products[0].discountRate > 0 && (
                            <span className="text-2xl font-bold text-accent">{deal.products[0].discountRate}%</span>
                          )}
                          <span className="text-3xl font-bold text-gray-900">
                            {deal.products[0].discountedPrice.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* 나머지 2개 - 작게 */}
                  <div className="flex flex-col gap-6">
                    {deal.products.slice(1, 3).map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="bg-white rounded-xl border hover:shadow-lg transition-shadow"
                      >
                        <div className="relative">
                          <img
                            src={product.imageUrl || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-t-xl"
                          />
                          {product.discountRate && product.discountRate > 0 && (
                            <div className="absolute top-2 left-2 bg-accent text-white px-3 py-1 rounded-md font-bold">
                              {product.discountRate}%
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
                            {product.name}
                          </h3>
                          <div className="space-y-1">
                            {product.discountRate && product.discountRate > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                {product.price.toLocaleString()}원
                              </div>
                            )}
                            <div className="flex items-baseline gap-2">
                              {product.discountRate && product.discountRate > 0 && (
                                <span className="text-base font-bold text-accent">{product.discountRate}%</span>
                              )}
                              <span className="text-lg font-bold text-gray-900">
                                {product.discountedPrice.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        }

        // 4개: 2x2 그리드
        if (productCount === 4) {
          return (
            <section key={deal.id} className="py-10 bg-gradient-to-br from-primary-50 to-secondary/10 border-y">
              <div className="container mx-auto px-4 max-w-6xl">
                {/* 헤더 */}
                <div className="text-center mb-8">
                  <div className="mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{deal.title}</h2>
                  </div>
                  {deal.description && (
                    <p className="text-gray-600 mb-2">{deal.description}</p>
                  )}
                  <div className="flex justify-center text-primary">
                    <CountdownTimer
                      endTime={deal.endTime}
                      onExpire={() => fetchSpecialDeals()}
                      className="text-lg font-bold"
                    />
                  </div>
                </div>

                {/* 4개 그리드 */}
                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {deal.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white rounded-xl border hover:border-primary hover:shadow-xl transition-all"
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-64 object-cover rounded-t-xl"
                        />
                        {product.discountRate && product.discountRate > 0 && (
                          <div className="absolute top-3 left-3 bg-accent text-white px-4 py-2 rounded-lg font-bold text-lg">
                            {product.discountRate}%
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
                          {product.name}
                        </h3>
                        <div className="space-y-1">
                          {product.discountRate && product.discountRate > 0 && (
                            <div className="text-base text-gray-400 line-through">
                              {product.price.toLocaleString()}원
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            {product.discountRate && product.discountRate > 0 && (
                              <span className="text-xl font-bold text-accent">{product.discountRate}%</span>
                            )}
                            <span className="text-2xl font-bold text-gray-900">
                              {product.discountedPrice.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )
        }

        // 5개 이상: 가로 스크롤 (기존 스타일)
        return (
          <section key={deal.id} className="py-8 bg-gradient-to-br from-primary-50 to-secondary/10 border-y">
            <div className="container mx-auto px-4 max-w-6xl">
              {/* 헤더를 상단 중앙으로 */}
              <div className="text-center mb-6">
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{deal.title}</h2>
                </div>
                {deal.description && (
                  <p className="text-sm text-gray-600 mb-2">{deal.description}</p>
                )}
                <div className="flex justify-center text-primary">
                  <CountdownTimer
                    endTime={deal.endTime}
                    onExpire={() => fetchSpecialDeals()}
                    className="text-lg font-bold"
                  />
                </div>
              </div>

              {/* 상품 카드 (가로 스크롤) */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 justify-start">
                  {deal.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="flex-shrink-0 w-56 bg-white rounded-lg border hover:shadow-lg transition-shadow"
                      >
                        <div className="relative">
                          <img
                            src={product.imageUrl || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-56 object-cover rounded-t-lg"
                          />
                          {product.discountRate && product.discountRate > 0 && (
                            <div className="absolute top-2 left-2 bg-accent text-white px-3 py-1 rounded-md font-bold text-sm">
                              {product.discountRate}%
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-gray-600 mb-1">{product.category}</p>
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          <div className="space-y-1">
                            {product.discountRate && product.discountRate > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                {product.price.toLocaleString()}원
                              </div>
                            )}
                            <div className="flex items-baseline gap-2">
                              {product.discountRate && product.discountRate > 0 && (
                                <span className="text-base font-bold text-accent">{product.discountRate}%</span>
                              )}
                              <span className="text-lg font-bold text-gray-900">
                                {product.discountedPrice.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )
      })}

      <AddToCartModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </>
  )
}
