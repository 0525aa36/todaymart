import { Metadata } from 'next'

const SITE_NAME = '오늘마트'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://todaymart.co.kr'
const DEFAULT_DESCRIPTION = '신선한 농수산물을 농가에서 직접 배송받으세요. 오늘 주문하면 내일 도착!'
const DEFAULT_IMAGE = '/logo_todaymart.png'

interface GenerateMetadataParams {
  title: string
  description?: string
  keywords?: string[]
  images?: string[]
  url?: string
  type?: 'website' | 'article' | 'product'
  price?: number
  currency?: string
  availability?: 'in stock' | 'out of stock'
  brand?: string
  category?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noindex?: boolean
}

export function generateSEOMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  images = [DEFAULT_IMAGE],
  url = SITE_URL,
  type = 'website',
  price,
  currency = 'KRW',
  availability,
  brand = SITE_NAME,
  category,
  publishedTime,
  modifiedTime,
  author,
  noindex = false,
}: GenerateMetadataParams): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const canonicalUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`

  // 이미지 URL 정규화
  const normalizedImages = images.map(img => {
    if (img.startsWith('http')) return img
    if (img.startsWith('/')) return `${SITE_URL}${img}`
    return `${SITE_URL}/${img}`
  })

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: type as any,
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      images: normalizedImages.map(image => ({
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      })),
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: normalizedImages,
      creator: '@todaymart',
      site: '@todaymart',
    },
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
    themeColor: '#10b981',
  }

  // 상품 페이지인 경우 추가 메타데이터
  if (type === 'product' && price) {
    ;(metadata as any).other = {
      'product:price:amount': price.toString(),
      'product:price:currency': currency,
      ...(availability && { 'product:availability': availability }),
      ...(brand && { 'product:brand': brand }),
      ...(category && { 'product:category': category }),
    }
  }

  return metadata
}

// JSON-LD 스키마 생성 헬퍼
export function generateProductSchema({
  id,
  name,
  description,
  image,
  price,
  discountedPrice,
  currency = 'KRW',
  availability = 'https://schema.org/InStock',
  brand = SITE_NAME,
  category,
  ratingValue,
  reviewCount,
  sku,
}: {
  id: string
  name: string
  description?: string
  image: string | string[]
  price: number
  discountedPrice?: number
  currency?: string
  availability?: string
  brand?: string
  category?: string
  ratingValue?: number
  reviewCount?: number
  sku?: string
}) {
  const images = Array.isArray(image) ? image : [image]
  const normalizedImages = images.map(img => {
    if (img.startsWith('http')) return img
    return `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`
  })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: normalizedImages,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${id}`,
      priceCurrency: currency,
      price: discountedPrice || price,
      availability,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    ...(sku && { sku }),
    ...(category && { category }),
  }

  // 평점 정보가 있으면 추가
  if (ratingValue && reviewCount) {
    ;(schema as any).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

// 조직 스키마 생성
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo_todaymart.png`,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressLocality: '서울',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+82-2-1234-5678',
      contactType: 'customer service',
      areaServed: 'KR',
      availableLanguage: 'Korean',
    },
    sameAs: [
      'https://www.facebook.com/todaymart',
      'https://www.instagram.com/todaymart',
      'https://blog.naver.com/todaymart',
    ],
  }
}

// 빵 부스러기 스키마 생성
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

// FAQ 스키마 생성
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// 검색 박스 스키마 생성
export function generateSearchBoxSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?keyword={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// 로컬 비즈니스 스키마 생성
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: SITE_NAME,
    image: `${SITE_URL}/logo_todaymart.png`,
    '@id': SITE_URL,
    url: SITE_URL,
    telephone: '+82-2-1234-5678',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '서울특별시 강남구',
      addressLocality: '서울',
      addressRegion: '서울특별시',
      postalCode: '06000',
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.5665,
      longitude: 126.9780,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: '₩₩',
  }
}