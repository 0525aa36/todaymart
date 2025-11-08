'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { LoadingSpinner } from '@/components/loading-spinner';
import { COLORS } from '@/lib/colors';
import BannerCarousel from '@/components/banner-carousel';
import SignupPromotionModal from '@/components/signup-promotion-modal';

interface Product {
  id: number;
  name: string;
  category: string;
  origin: string;
  price: number;
  discountRate: number | null;
  discountedPrice: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  averageRating: number;
  reviewCount: number;
  optionCount: number;
}

interface ProductCardData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  hasOptions?: boolean;
}

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
}

export function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchBanners();
  }, []);

  const fetchData = async () => {
    try {
      const productsData = await apiFetch<{ content?: Product[] }>(
        '/api/products?size=50&sort=createdAt,desc'
      );
      setAllProducts(productsData.content || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const bannersData = await apiFetch<Banner[]>('/api/banners');
      setBanners(bannersData || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    } finally {
      setBannersLoading(false);
    }
  };

  // Convert backend Product to ProductCard props
  const convertToCardData = (
    product: Product,
    badge?: string
  ): ProductCardData => ({
    id: product.id.toString(),
    name: product.name,
    price: product.discountedPrice,
    originalPrice:
      product.discountRate && product.discountRate > 0
        ? product.price
        : undefined,
    image: product.imageUrl || '/placeholder.svg',
    badge: badge || product.category,
    rating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    hasOptions: product.optionCount > 0,
  });

  // Get products by category
  const getProductsByCategory = (category: string, limit: number = 10) => {
    return allProducts
      .filter((p) => p.category === category)
      .slice(0, limit)
      .map((p) => convertToCardData(p));
  };

  // Get new products
  const newProducts = allProducts
    .slice(0, 10)
    .map((p) => convertToCardData(p, 'NEW'));

  // Get discounted products
  const discountedProducts = allProducts
    .filter((p) => p.discountRate && p.discountRate > 0)
    .slice(0, 10)
    .map((p) => convertToCardData(p, '특가'));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SignupPromotionModal />
      <Header />

      <main className="flex-1">
        {/* Banner Section - DB에서 불러온 배너 표시 */}
        {!bannersLoading && banners.length > 0 && (
          <section className="relative w-full overflow-hidden">
            <BannerCarousel />
          </section>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Best Products Section */}
            {discountedProducts.length > 0 && (
              <section className="py-12 bg-white">
                <div className="container mx-auto px-4 max-w-6xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">베스트</h2>
                    <Link href="/search?sort=best">
                      <Button variant="ghost" className="text-sm">
                        전체보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {discountedProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* New Products Section */}
            {newProducts.length > 0 && (
              <section className="py-12 bg-gray-50 border-t">
                <div className="container mx-auto px-4 max-w-6xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">신상품</h2>
                    <Link href="/search?sort=new">
                      <Button variant="ghost" className="text-sm">
                        전체보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {newProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Category Sections */}
            {['채소', '과일', '수산물', '축산물'].map((category, index) => {
              const categoryProducts = getProductsByCategory(category, 10);
              if (categoryProducts.length === 0) return null;

              return (
                <section
                  key={category}
                  className={`py-12 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } border-t`}
                >
                  <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <Link
                        href={`/search?category=${encodeURIComponent(
                          category
                        )}`}
                      >
                        <Button variant="ghost" className="text-sm">
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
              );
            })}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

