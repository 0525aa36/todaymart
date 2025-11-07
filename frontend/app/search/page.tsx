"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
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

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get("keyword") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [origin, setOrigin] = useState(searchParams.get("origin") || "")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const keyword = searchParams.get("keyword") || ""
    const cat = searchParams.get("category") || ""
    const org = searchParams.get("origin") || ""
    setSearchKeyword(keyword)
    setCategory(cat)
    setOrigin(org)
    searchProducts(keyword, cat, org, 0)
  }, [searchParams])

  const searchProducts = async (keyword: string, cat: string, org: string, page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.append("keyword", keyword)
      if (cat) params.append("category", cat)
      if (org) params.append("origin", org)
      params.append("page", page.toString())
      params.append("size", "12")

      const data = await apiFetch<SearchResponse>(`/api/products/search?${params.toString()}`)
      setProducts(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
      setCurrentPage(data.number)
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchKeyword) params.append("keyword", searchKeyword)
    if (category) params.append("category", category)
    if (origin) params.append("origin", origin)
    router.push(`/search?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    const params = new URLSearchParams()
    if (searchKeyword) params.append("keyword", searchKeyword)
    if (value) params.append("category", value)
    if (origin) params.append("origin", origin)
    router.push(`/search?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    searchProducts(searchKeyword, category, origin, page)
  }

  return (
    <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">상품 검색</h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    type="search"
                    placeholder="상품명으로 검색"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    <SelectItem value="채소">채소</SelectItem>
                    <SelectItem value="과일">과일</SelectItem>
                    <SelectItem value="수산물">수산물</SelectItem>
                    <SelectItem value="축산물">축산물</SelectItem>
                    <SelectItem value="쌀/잡곡">쌀/잡곡</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
              </div>
            </form>

            {/* Search Result Info */}
            {!loading && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  {searchKeyword && (
                    <>
                      <strong>"{searchKeyword}"</strong> 검색 결과{" "}
                    </>
                  )}
                  총 <strong>{totalElements}</strong>개의 상품
                </p>
                {(searchKeyword || category || origin) && (
                  <div className="flex gap-2 items-center">
                    {searchKeyword && (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => {
                        setSearchKeyword("")
                        const params = new URLSearchParams()
                        if (category) params.append("category", category)
                        if (origin) params.append("origin", origin)
                        router.push(`/search${params.toString() ? '?' + params.toString() : ''}`)
                      }}>
                        {searchKeyword} ✕
                      </Badge>
                    )}
                    {category && (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => {
                        setCategory("")
                        const params = new URLSearchParams()
                        if (searchKeyword) params.append("keyword", searchKeyword)
                        if (origin) params.append("origin", origin)
                        router.push(`/search${params.toString() ? '?' + params.toString() : ''}`)
                      }}>
                        {category} ✕
                      </Badge>
                    )}
                  </div>
                )}
              </div>
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

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
