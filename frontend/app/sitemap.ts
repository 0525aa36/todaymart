import { MetadataRoute } from 'next'

// 백엔드 API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://todaymart.co.kr'

interface Product {
  id: number
  updatedAt: string
}

interface Category {
  code: string
  updatedAt?: string
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/api/products?size=1000`, {
      next: { revalidate: 3600 } // 1시간마다 재검증
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.content || []
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
    return []
  }
}

async function fetchCategories(): Promise<Category[]> {
  // 카테고리는 하드코딩되어 있으므로 직접 정의
  return [
    { code: 'vegetables' },
    { code: 'fruits' },
    { code: 'meat' },
    { code: 'seafood' },
    { code: 'rice-grains' },
    { code: 'eggs-dairy' },
    { code: 'processed' },
    { code: 'kimchi' },
    { code: 'health' },
    { code: 'sauce' }
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts()
  const categories = await fetchCategories()

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/help/notices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/help/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 카테고리 페이지들
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.code}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // 상품 페이지들
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}