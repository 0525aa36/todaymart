import { Metadata } from 'next';
import CategoryManagementPage from './CategoryManagementPage';

export const metadata: Metadata = {
  title: '카테고리 관리 | 관리자',
  description: '카테고리 생성, 수정, 삭제 및 순서 관리',
};

export default function Page() {
  return <CategoryManagementPage />;
}