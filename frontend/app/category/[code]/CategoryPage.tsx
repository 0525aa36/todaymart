'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface Category {
  id: number;
  code: string;
  name: string;
  description: string;
  iconName: string;
  children: Category[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  discountRate?: number;
  discountedPrice?: number;
  imageUrl: string;
  origin: string;
  averageRating?: number;
  reviewCount?: number;
  hasOptions?: boolean;
}

interface ProductsResponse {
  content: Product[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface CategoryPageProps {
  code: string;
  page?: string;
}

export default function CategoryPage({ code, page }: CategoryPageProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(page || '0');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 카테고리 정보 조회
        const categoryData = await apiFetch<Category>(`/api/categories/${code}`);
        setCategory(categoryData);

        // 카테고리별 상품 조회
        const productsData = await apiFetch<ProductsResponse>(
          `/api/products/category/${code}?page=${currentPage}&size=20`
        );
        setProducts(productsData);
      } catch (err: any) {
        console.error('Failed to fetch category data:', err);
        setError(err.message || '카테고리를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code, currentPage]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">로딩 중...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !category) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/category/${code}?page=${newPage}`);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 카테고리 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {category.iconName && (
              <span className="text-4xl">{category.iconName}</span>
            )}
            <h1 className="text-3xl font-bold">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>

        {/* 하위 카테고리 탭 */}
        {category.children && category.children.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <Button
              variant={!page ? 'default' : 'outline'}
              asChild
            >
              <Link href={`/category/${code}`}>전체</Link>
            </Button>
            {category.children.map((child) => (
              <Button
                key={child.code}
                variant="outline"
                asChild
              >
                <Link href={`/category/${child.code}`}>
                  {child.iconName} {child.name}
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* 상품 목록 */}
        {products && products.content.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {products.content.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  name={product.name}
                  price={product.discountedPrice || product.price}
                  originalPrice={product.discountRate ? product.price : undefined}
                  image={product.imageUrl || '/placeholder.jpg'}
                  rating={product.averageRating}
                  reviewCount={product.reviewCount}
                  hasOptions={product.hasOptions}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {products.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: products.totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= products.totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              등록된 상품이 없습니다.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}