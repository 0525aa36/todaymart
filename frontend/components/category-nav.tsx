'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';

interface Category {
  id: number;
  code: string;
  name: string;
  iconName: string;
  children: Category[];
  isEvent: boolean;
}

export function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiFetch<Category[]>('/api/categories');
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* 카테고리 버튼 */}
      <Button
        ref={buttonRef}
        variant="ghost"
        className="flex items-center gap-2 hover:bg-primary/10"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="font-semibold">카테고리</span>
      </Button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-0 w-52 bg-white shadow-2xl border rounded-b-lg z-50"
          onMouseLeave={() => {
            setIsOpen(false);
            setHoveredCategory(null);
          }}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                href={`/category/${category.code}`}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                  hoveredCategory === category.id ? 'bg-gray-50' : ''
                }`}
                style={category.isEvent ? {
                  backgroundColor: 'var(--color-primary-50)',
                } : undefined}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{category.iconName}</span>
                  <span
                    className="font-medium text-sm"
                    style={category.isEvent ? { color: 'var(--color-primary)' } : { color: '#1f2937' }}
                  >
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {category.isEvent && (
                    <span className="text-white text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }}>
                      N
                    </span>
                  )}
                  {category.children && category.children.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </Link>

              {/* 하위 카테고리 (오른쪽에 표시) */}
              {category.children && category.children.length > 0 && hoveredCategory === category.id && (
                <div className="absolute left-full top-0 w-44 bg-white shadow-2xl border rounded-r-lg ml-0 z-[60]">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.code}`}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm border-b last:border-b-0"
                      onClick={() => {
                        setIsOpen(false);
                        setHoveredCategory(null);
                      }}
                    >
                      <span className="text-lg">{child.iconName}</span>
                      <span className="text-gray-700">{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}