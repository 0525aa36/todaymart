"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/loading-spinner"

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
  createdAt: string
  averageRating: number
  reviewCount: number
  optionCount: number
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
}

interface Banner {
  id: number
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  displayOrder: number
  isActive: boolean
  backgroundColor: string
  textColor: string
}

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsData, bannersData] = await Promise.all([
        apiFetch<{ content?: Product[] }>("/api/products?size=50&sort=createdAt,desc"),
        apiFetch<Banner[]>("/api/banners")
      ])
      setAllProducts(productsData.content || [])
      setBanners(bannersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  // Convert backend Product to ProductCard props
  const convertToCardData = (product: Product, badge?: string): ProductCardData => ({
    id: product.id.toString(),
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.discountRate && product.discountRate > 0 ? product.price : undefined,
    image: product.imageUrl || "/placeholder.svg",
    badge: badge || product.category,
    rating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    hasOptions: product.optionCount > 0,
  })

  // Get products by category
  const getProductsByCategory = (category: string, limit: number = 10) => {
    return allProducts
      .filter((p) => p.category === category)
      .slice(0, limit)
      .map((p) => convertToCardData(p))
  }

  // Get new products
  const newProducts = allProducts.slice(0, 10).map((p) => convertToCardData(p, "NEW"))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Banner Carousel */}
        {banners.length > 0 && (
          <section className="relative h-[280px] md:h-[360px] overflow-hidden">
            <div className="relative h-full">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentBannerIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {banner.linkUrl ? (
                    <Link href={banner.linkUrl} className="block w-full h-full">
                      {banner.imageUrl && (
                        <img
                          src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `http://localhost:8081${banner.imageUrl}`}
                          alt={banner.title}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      )}
                    </Link>
                  ) : (
                    banner.imageUrl && (
                      <img
                        src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `http://localhost:8081${banner.imageUrl}`}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                </div>
              ))}
            </div>

            {/* Banner Navigation */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Banner Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentBannerIndex ? "bg-white w-8" : "bg-white/50"
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* New Products Section */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">신상품</h2>
                  <Link href="/search">
                    <Button variant="ghost">
                      전체보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {newProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">등록된 상품이 없습니다</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {newProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Category Sections - Show if products exist */}
            {["채소", "과일", "수산물", "축산물"].map((category) => {
              const categoryProducts = getProductsByCategory(category, 10)
              if (categoryProducts.length === 0) return null

              return (
                <section key={category} className="py-12 border-t">
                  <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <Link href={`/search?category=${encodeURIComponent(category)}`}>
                        <Button variant="ghost">
                          전체보기
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} {...product} />
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
