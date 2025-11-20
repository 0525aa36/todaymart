import { ProductDetailPage } from './ProductDetailPage';
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://todaymart.co.kr';

interface Product {
  id: number;
  name: string;
  summary?: string;
  description?: string;
  price: number;
  discountedPrice: number;
  discountRate?: number;
  imageUrl?: string;
  imageUrls?: string; // 쉼표로 구분된 이미지 URL 문자열
  detailImageUrls?: string[] | string; // API에서 문자열 또는 배열로 올 수 있음
  category?: string;
  categoryName?: string;
  averageRating?: number;
  reviewCount?: number;
  stockStatus?: string;
  origin?: string;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      next: { revalidate: 60 }, // 1분마다 재검증
      cache: 'no-store', // 개발 중에는 캐시 비활성화
    });
    if (!response.ok) {
      console.error(`Failed to fetch product ${id}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log(`Product ${id} data:`, JSON.stringify(data).substring(0, 200));
    return data;
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      console.error('generateMetadata: No ID provided');
      return generateSEOMetadata({
        title: '상품 정보 로딩 중',
        description: '상품 정보를 불러오는 중입니다.',
        noindex: true,
      });
    }

    const product = await getProduct(id);

    if (!product) {
      return generateSEOMetadata({
        title: '상품을 찾을 수 없습니다',
        description: '요청하신 상품을 찾을 수 없습니다.',
        noindex: true,
      });
    }

    // 이미지 URL 정규화 - 안전하게 처리
    const images = [];

    try {
      if (product.imageUrl) {
        const imageUrl = String(product.imageUrl).trim();
        if (imageUrl) {
          images.push(imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`);
        }
      }

      // detailImageUrls 처리 - 더 안전하게
      if (product.detailImageUrls) {
        let detailUrls = [];

        if (Array.isArray(product.detailImageUrls)) {
          detailUrls = product.detailImageUrls;
        } else if (typeof product.detailImageUrls === 'string') {
          const trimmed = product.detailImageUrls.trim();
          if (trimmed && trimmed.includes(',')) {
            detailUrls = trimmed.split(',').map(url => url.trim());
          } else if (trimmed) {
            detailUrls = [trimmed];
          }
        }

        detailUrls.slice(0, 3).forEach(url => {
          if (url && typeof url === 'string') {
            const trimmedUrl = url.trim();
            if (trimmedUrl) {
              images.push(trimmedUrl.startsWith('http') ? trimmedUrl : `${API_URL}${trimmedUrl}`);
            }
          }
        });
      }

      // imageUrls도 처리 (쉼표로 구분된 문자열)
      if (!images.length && product.imageUrls) {
        const imageUrls = typeof product.imageUrls === 'string'
          ? product.imageUrls.split(',').map(url => url.trim())
          : [];

        imageUrls.slice(0, 3).forEach(url => {
          if (url) {
            images.push(url.startsWith('http') ? url : `${API_URL}${url}`);
          }
        });
      }
    } catch (imageError) {
      console.error('Error processing images:', imageError);
      // 이미지 처리 실패해도 계속 진행
    }

    // 재고 상태
    const availability = product.stockStatus === 'SOLD_OUT' ? 'out of stock' : 'in stock';

    // 가격 정보
    const price = product.discountedPrice || product.price || 0;

    // 설명 생성 - 안전하게
    let description = product.summary || product.description || `${product.name || '상품'} - 오늘마트에서 신선하게 배송해드립니다.`;

    // 할인율이 있으면 추가
    if (product.discountRate && product.discountRate > 0) {
      description = `[${product.discountRate}% 할인] ${description}`;
    }

    // 원산지 정보가 있으면 추가
    if (product.origin) {
      description += ` 원산지: ${product.origin}`;
    }

    // 평점 정보가 있으면 추가
    if (product.averageRating && product.reviewCount) {
      description += ` | 평점 ${product.averageRating}점 (리뷰 ${product.reviewCount}개)`;
    }

    // 설명이 너무 길면 자르기
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    // 키워드 생성
    const keywords = [
      product.name || '',
      product.categoryName || product.category || '농수산물',
      '신선식품',
      '산지직송',
      '오늘마트',
      product.origin || '국내산',
    ].filter(Boolean);

    return generateSEOMetadata({
      title: product.name || '상품',
      description,
      keywords,
      images: images.length > 0 ? images : undefined,
      url: `/product/${product.id}`,
      type: 'product',
      price,
      availability,
      category: product.categoryName || product.category,
    });
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return generateSEOMetadata({
      title: '상품 정보 로딩 중',
      description: '상품 정보를 불러오는 중입니다.',
      noindex: true,
    });
  }
}

export default function Page() {
  return <ProductDetailPage />;
}
