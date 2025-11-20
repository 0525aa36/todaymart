import { Metadata } from 'next';
import CategoryPage from './CategoryPage';
import { generateSEOMetadata } from '@/lib/seo-utils';

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ page?: string }>;
};

// 카테고리 정보 매핑
const categoryInfo: Record<string, {
  name: string;
  description: string;
  keywords: string[];
  image?: string;
}> = {
  'vegetables': {
    name: '채소',
    description: '산지직송으로 더욱 신선한 채소를 만나보세요. 유기농, 무농약 친환경 채소부터 제철 채소까지 다양하게 준비했습니다.',
    keywords: ['신선채소', '유기농채소', '친환경채소', '제철채소', '샐러드채소', '쌈채소'],
  },
  'fruits': {
    name: '과일',
    description: '당도 높고 신선한 제철 과일을 산지에서 직접 배송합니다. 엄선된 농가의 프리미엄 과일을 만나보세요.',
    keywords: ['신선과일', '제철과일', '국산과일', '수입과일', '과일선물세트', '당도선별'],
  },
  'meat': {
    name: '정육',
    description: '믿을 수 있는 축산농가의 신선한 한우, 돼지고기, 닭고기를 만나보세요. 당일 도축, 당일 배송으로 신선함을 보장합니다.',
    keywords: ['한우', '돼지고기', '닭고기', '소고기', '축산물', '정육', '프리미엄육류'],
  },
  'seafood': {
    name: '수산물',
    description: '전국 각지 어항에서 직송하는 싱싱한 수산물. 활어, 선어, 건어물까지 다양한 해산물을 준비했습니다.',
    keywords: ['생선', '활어', '해산물', '수산물', '새우', '조개', '건어물', '제철수산물'],
  },
  'rice-grains': {
    name: '쌀·잡곡',
    description: '믿고 먹을 수 있는 국내산 쌀과 영양 가득한 잡곡. 도정 당일 배송으로 더욱 신선합니다.',
    keywords: ['쌀', '잡곡', '현미', '찹쌀', '흑미', '보리', '국산쌀', '친환경쌀'],
  },
  'eggs-dairy': {
    name: '계란·유제품',
    description: '신선한 계란과 목장 직송 유제품. 무항생제 계란부터 프리미엄 치즈까지 다양하게 준비했습니다.',
    keywords: ['계란', '달걀', '우유', '치즈', '요거트', '유제품', '무항생제계란'],
  },
  'processed': {
    name: '가공식품',
    description: '엄선된 원재료로 만든 건강한 가공식품. 간편하면서도 맛있는 제품들을 만나보세요.',
    keywords: ['가공식품', '간편식', '즉석식품', '통조림', '레토르트', '냉동식품'],
  },
  'kimchi': {
    name: '김치·반찬',
    description: '전통 방식으로 정성껏 담근 김치와 맛있는 반찬. 엄마의 손맛 그대로 전해드립니다.',
    keywords: ['김치', '배추김치', '깍두기', '반찬', '밑반찬', '젓갈', '장아찌', '전통김치'],
  },
  'health': {
    name: '건강식품',
    description: '건강한 삶을 위한 프리미엄 건강식품. 홍삼, 비타민부터 건강즙까지 다양하게 준비했습니다.',
    keywords: ['건강식품', '홍삼', '비타민', '영양제', '건강즙', '건강음료', '건강기능식품'],
  },
  'sauce': {
    name: '양념·소스',
    description: '요리의 맛을 살려주는 다양한 양념과 소스. 전통 장류부터 세계 각국의 소스까지 만나보세요.',
    keywords: ['양념', '소스', '간장', '된장', '고추장', '참기름', '조미료', '장류'],
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const category = categoryInfo[code] || {
    name: code,
    description: `${code} 카테고리의 신선한 상품을 만나보세요`,
    keywords: [code, '농수산물']
  };

  const keywords = [
    category.name,
    '오늘마트',
    ...category.keywords,
    '산지직송',
    '신선식품'
  ];

  return generateSEOMetadata({
    title: `${category.name} - 신선한 ${category.name} 쇼핑`,
    description: category.description,
    keywords,
    url: `/category/${code}`,
    type: 'website',
    images: category.image ? [category.image] : undefined,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { code } = await params;
  const { page } = await searchParams;

  return <CategoryPage code={code} page={page} />;
}