'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { Leaf, Apple, Fish, Beef, Package, Droplet, Egg, Carrot } from 'lucide-react'

interface Category {
  id: number
  code: string
  name: string
  description: string
  iconName: string
  displayOrder: number
  isVisible: boolean
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'leaf': Leaf,
  'apple': Apple,
  'fish': Fish,
  'beef': Beef,
  'package': Package,
  'droplet': Droplet,
  'egg': Egg,
  'carrot': Carrot,
}

export function CategoryQuickMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories')
      // 표시 순서대로 정렬하고 최대 8개만 표시
      const sorted = data
        .filter(cat => cat.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .slice(0, 8)
      setCategories(sorted)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-8 bg-gray-50 border-y">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-gray-50 border-y">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.iconName] || Package

            return (
              <Link
                key={category.id}
                href={`/search?category=${encodeURIComponent(category.code)}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center transition-all group-hover:border-primary group-hover:shadow-md group-hover:scale-110">
                  <IconComponent className="w-8 h-8 text-primary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors text-center">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
