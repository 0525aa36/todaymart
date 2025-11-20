import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo-utils';

interface ProductSchemaProps {
  product: {
    id: number;
    name: string;
    description?: string;
    summary?: string;
    imageUrl?: string;
    detailImageUrls?: string[];
    price: number;
    discountedPrice: number;
    stockStatus: string;
    category?: string;
    origin?: string;
  };
  reviewStats?: {
    averageRating: number;
    reviewCount: number;
  };
  categoryName?: string;
}

export function ProductSchema({ product, reviewStats, categoryName }: ProductSchemaProps) {
  // 상품 이미지 배열 생성
  const images = [];
  if (product.imageUrl) {
    images.push(product.imageUrl);
  }
  if (product.detailImageUrls && product.detailImageUrls.length > 0) {
    images.push(...product.detailImageUrls.slice(0, 4)); // 최대 4개까지
  }

  // 재고 상태 매핑
  const availability = product.stockStatus === 'SOLD_OUT'
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  // 상품 스키마 생성
  const productSchema = generateProductSchema({
    id: product.id.toString(),
    name: product.name,
    description: product.summary || product.description || `${product.name} - 오늘마트에서 신선하게 배송해드립니다.`,
    image: images,
    price: product.price,
    discountedPrice: product.discountedPrice,
    availability,
    category: categoryName || product.category,
    ratingValue: reviewStats?.averageRating,
    reviewCount: reviewStats?.reviewCount,
    sku: `TM-${product.id}`,
  });

  // 빵부스러기 스키마 생성
  const breadcrumbItems = [
    { name: '홈', url: '/' },
  ];

  if (categoryName && product.category) {
    breadcrumbItems.push({
      name: categoryName,
      url: `/category/${product.category}`
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: `/product/${product.id}`
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}