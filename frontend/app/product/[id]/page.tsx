import { ProductDetailPage } from './ProductDetailPage';
import { Metadata } from 'next';

// 임시로 정적 메타데이터 사용
export const metadata: Metadata = {
  title: '상품 상세 | 오늘마트',
  description: '오늘마트에서 신선한 농수산물을 만나보세요.',
};

// generateMetadata 임시 비활성화 - 프로덕션 오류 해결을 위해
// TODO: Server Component 오류 해결 후 다시 활성화

export default function Page() {
  return <ProductDetailPage />;
}