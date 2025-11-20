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
    });
    if (!response.ok) return null;
    return await response.json();
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
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return generateSEOMetadata({
      title: '상품을 찾을 수 없습니다',
      description: '요청하신 상품을 찾을 수 없습니다.',
      noindex: true,
    });
  }

  // 이미지 URL 정규화
  const images = [];
  if (product.imageUrl) {
    images.push(product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`);
  }
  if (product.detailImageUrls) {
    // detailImageUrls가 배열인지 문자열인지 확인
    const detailUrls = Array.isArray(product.detailImageUrls)
      ? product.detailImageUrls
      : typeof product.detailImageUrls === 'string' && product.detailImageUrls.trim()
        ? product.detailImageUrls.split(',').map(url => url.trim())
        : [];

    detailUrls.slice(0, 3).forEach(url => {
      if (url) {
        images.push(url.startsWith('http') ? url : `${API_URL}${url}`);
      }
    });
  }

  // 재고 상태
  const availability = product.stockStatus === 'SOLD_OUT' ? 'out of stock' : 'in stock';

  // 가격 정보
  const price = product.discountedPrice || product.price;
  const originalPrice = product.price;

  // 설명 생성
  let description = product.summary || product.description || `${product.name} - 오늘마트에서 신선하게 배송해드립니다.`;

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

  // 키워드 생성
  const keywords = [
    product.name,
    product.categoryName || product.category || '농수산물',
    '신선식품',
    '산지직송',
    '오늘마트',
    product.origin || '국내산',
  ];

  return generateSEOMetadata({
    title: product.name,
    description,
    keywords,
    images,
    url: `/product/${product.id}`,
    type: 'product',
    price,
    availability,
    category: product.categoryName || product.category,
  });
}

export default function Page() {
  return <ProductDetailPage />;
}
