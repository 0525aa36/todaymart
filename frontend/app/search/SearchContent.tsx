"use client"

import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api-client"

interface Product {
  id: number
  name: string
  category: string
  origin: string
  price: number
  discountRate: number | null
  discountedPrice: number
  stock: number
  imageUrl: string
  averageRating: number
  reviewCount: number
  optionCount: number
}

interface SearchResponse {
  content: Product[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get("keyword") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [sortType, setSortType] = useState(searchParams.get("sort") || "")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const keyword = searchParams.get("keyword") || ""
    const cat = searchParams.get("category") || ""
    const sort = searchParams.get("sort") || ""
    setSearchKeyword(keyword)
    setCategory(cat)
    setSortType(sort)
    searchProducts(keyword, cat, sort, 0)
  }, [searchParams])

  const searchProducts = async (keyword: string, cat: string, sort: string, page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.append("keyword", keyword)
      if (cat) params.append("category", cat)
      params.append("page", page.toString())
      params.append("size", "20")

      // sort 파라미터에 따라 정렬 설정
      if (sort === "best") {
        // 베스트: 판매량 순
        params.append("sort", "salesCount,desc")
      } else if (sort === "new") {
        // 신상: 최신순
        params.append("sort", "createdAt,desc")
      } else if (sort === "discount") {
        // 세일: 할인율 높은 순
        params.append("sort", "discountRate,desc")
      } else if (sort === "trending") {
        // 인기: 조회수 순
        params.append("sort", "viewCount,desc")
      } else if (sort === "special") {
        // 특가: 할인율이 있는 상품만 + 할인율 높은 순
        params.append("sort", "discountRate,desc")
      }

      const data = await apiFetch<SearchResponse>(`/api/products/search?${params.toString()}`)

      // 특가의 경우 할인율이 있는 상품만 필터링
      if (sort === "special") {
        const filteredContent = data.content.filter(p => p.discountRate && p.discountRate > 0)
        setProducts(filteredContent)
        setTotalElements(filteredContent.length)
      } else {
        setProducts(data.content)
        setTotalElements(data.totalElements)
      }

      setTotalPages(data.totalPages)
      setCurrentPage(data.number)
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    searchProducts(searchKeyword, category, sortType, page)
  }

  const getPageTitle = () => {
    if (sortType === "best") return "베스트 상품"
    if (sortType === "new") return "신상품"
    if (sortType === "discount") return "세일 상품"
    if (sortType === "special") return "특가 상품"
    if (sortType === "trending") return "인기 상품"
    return "상품 검색"
  }

  return (
    <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{getPageTitle()}</h1>

            {/* Search Result Info */}
            {!loading && (
              <p className="text-muted-foreground">
                총 <strong>{totalElements}</strong>개의 상품
              </p>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
                <p className="text-muted-foreground">검색 중...</p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id.toString()}
                    name={product.name}
                    price={product.discountedPrice}
                    originalPrice={product.discountRate && product.discountRate > 0 ? product.price : undefined}
                    image={product.imageUrl || "/placeholder-product.jpg"}
                    rating={product.averageRating || 0}
                    reviewCount={product.reviewCount || 0}
                    hasOptions={product.optionCount > 0}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    이전
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-2">검색 결과가 없습니다</h2>
              <p className="text-muted-foreground mb-6">다른 검색어를 시도해보세요</p>
              <Button onClick={() => router.push("/")}>홈으로 돌아가기</Button>
            </div>
          )}
    </div>
  )
}

