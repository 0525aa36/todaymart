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
import BannerCarousel from '@/components/banner-carousel';
import SignupPromotionModal from '@/components/signup-promotion-modal';
import { NoticePopup } from '@/components/notice-popup';
import { WeeklySpecialSection } from '@/components/weekly-special-section';
import { MdPickSection } from '@/components/md-pick-section';
import { TrendingProductsSection } from '@/components/trending-products-section';

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

interface HomeSection {
  id: number;
  sectionType: string;
  title: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  config: Record<string, any>;
}

export function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchBanners();
    fetchSections();
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

  const fetchSections = async () => {
    try {
      const sectionsData = await apiFetch<HomeSection[]>('/api/home-sections');
      setSections(sectionsData || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    } finally {
      setSectionsLoading(false);
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
    console.log('Filtering category:', category, 'Total products:', allProducts.length);
    const filtered = allProducts.filter((p) => {
      const matches = p.category === category;
      if (matches) {
        console.log('Matched product:', p.name, 'Category:', p.category);
      }
      return matches;
    });
    console.log('Filtered products count:', filtered.length);
    return filtered
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

  // Render section based on type
  const renderSection = (section: HomeSection, index: number) => {
    switch (section.sectionType) {
      case 'BANNER':
        return (
          !bannersLoading && banners.length > 0 && (
            <section key={section.id} className="relative w-full overflow-hidden">
              <BannerCarousel />
            </section>
          )
        );

      case 'SPECIAL_DEAL':
        return <WeeklySpecialSection key={section.id} specialDealId={section.config?.specialDealId} />;

      case 'MD_PICK':
        return <MdPickSection key={section.id} />;

      case 'RANKING':
        return <TrendingProductsSection key={section.id} />;

      case 'NEW_ARRIVAL':
        return (
          newProducts.length > 0 && (
            <section key={section.id} className="py-16 bg-white border-t">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 mt-1">{section.description}</p>
                  </div>
                  <Link href="/search?sort=new">
                    <Button variant="ghost" className="text-sm gap-1">
                      전체보기
                      <ChevronRight className="h-4 w-4" />
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
          )
        );

      case 'CATEGORY':
        const category = section.config?.category || section.title;
        const categoryProducts = getProductsByCategory(category, section.config?.limit || 10);

        return (
          <section
            key={section.id}
            className={`py-16 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-t`}
          >
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-gray-600 mt-1">{section.description}</p>
                </div>
                {categoryProducts.length > 0 && (
                  <Link href={`/search?category=${encodeURIComponent(category)}`}>
                    <Button variant="ghost" className="text-sm gap-1">
                      전체보기
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              {categoryProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                  {categoryProducts.map((product) => {
                    const { badge, ...productWithoutBadge } = product;
                    return <ProductCard key={product.id} {...productWithoutBadge} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    "{category}" 카테고리에 등록된 상품이 없습니다.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    관리자 페이지에서 다른 카테고리를 선택하거나 상품을 등록해주세요.
                  </p>
                </div>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SignupPromotionModal />
      <NoticePopup />
      <Header />

      <main className="flex-1">
        {loading || sectionsLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Render sections dynamically based on database order */}
            {sections.map((section, index) => renderSection(section, index))}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

