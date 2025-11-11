import { Metadata } from 'next';
import CategoryPage from './CategoryPage';

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `${code} 카테고리 | 케이루츠`,
    description: `${code} 카테고리의 신선한 농산물을 만나보세요`,
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { code } = await params;
  const { page } = await searchParams;

  return <CategoryPage code={code} page={page} />;
}