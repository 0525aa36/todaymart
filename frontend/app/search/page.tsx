import { SearchPage } from './SearchPage';
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo-utils';

export async function generateMetadata({
  searchParams
}: {
  searchParams: { keyword?: string; category?: string }
}): Promise<Metadata> {
  const keyword = searchParams.keyword || '';
  const category = searchParams.category || '';

  // 카테고리 이름 매핑
  const categoryNames: Record<string, string> = {
    'vegetables': '채소',
    'fruits': '과일',
    'meat': '정육',
    'seafood': '수산물',
    'rice-grains': '쌀·잡곡',
    'eggs-dairy': '계란·유제품',
    'processed': '가공식품',
    'kimchi': '김치·반찬',
    'health': '건강식품',
    'sauce': '양념·소스'
  };

  const categoryName = category ? categoryNames[category] || category : '';

  // 동적 제목 생성
  let title = '상품 검색';
  if (keyword && categoryName) {
    title = `'${keyword}' 검색 결과 (${categoryName})`;
  } else if (keyword) {
    title = `'${keyword}' 검색 결과`;
  } else if (categoryName) {
    title = `${categoryName} 카테고리 상품`;
  }

  // 동적 설명 생성
  let description = '오늘마트에서 신선한 농수산물을 검색해보세요.';
  if (keyword) {
    description = `${keyword}에 대한 검색 결과입니다. 오늘마트에서 신선하고 품질 좋은 상품을 찾아보세요.`;
  }
  if (categoryName) {
    description += ` ${categoryName} 카테고리의 다양한 상품을 만나보실 수 있습니다.`;
  }

  // 키워드 생성
  const keywords = [
    '상품검색',
    '농수산물검색',
    '오늘마트',
    keyword,
    categoryName,
    '신선식품',
    '산지직송'
  ].filter(Boolean);

  // canonical URL 생성 (검색 파라미터 포함)
  let url = '/search';
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return generateSEOMetadata({
    title,
    description,
    keywords,
    url,
    type: 'website',
    noindex: !keyword && !category, // 빈 검색 페이지는 인덱싱하지 않음
  });
}

export default function Page() {
  return <SearchPage />;
}
