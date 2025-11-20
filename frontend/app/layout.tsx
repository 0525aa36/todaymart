import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const SITE_NAME = '오늘마트'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://todaymart.co.kr'
const SITE_DESCRIPTION = '신선한 농수산물을 농가에서 직접 배송받으세요. 오늘 주문하면 내일 도착! 산지직송으로 더욱 신선하고 저렴한 농수산물을 만나보세요.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10b981',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 농수산물 직송 쇼핑몰`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: '농수산물, 산지직송, 신선식품, 과일, 채소, 수산물, 정육, 농산물직거래, 오늘마트, 새벽배송, 당일배송',
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/logo_todaymart.png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 농수산물 직송 쇼핑몰`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '오늘마트 - 신선한 농수산물 직송',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - 농수산물 직송 쇼핑몰`,
    description: SITE_DESCRIPTION,
    site: '@todaymart',
    creator: '@todaymart',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'TcvgrhyvOzoOpJmgZmBX4rb9D_l4zFcEAii0ZE-wPXA', // Google Search Console 인증
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
    other: {
      'naver-site-verification': 'ef34af2d871ce97ea6af9ddb2e9dd9869361c05c', // 네이버 웹마스터도구
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  category: '쇼핑',
  classification: '농수산물 쇼핑몰',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' },
  ],
  other: {
    'msapplication-TileColor': '#10b981',
    'msapplication-config': '/browserconfig.xml',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          async
        />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              marginBottom: '1rem',
              marginRight: '1rem',
              backgroundColor: '#DAE7E9',
              border: 'none',
              color: '#1a1a1a',
            },
            classNames: {
              closeButton: '!bg-transparent !text-black hover:!bg-black/10 !border-none',
            },
          }}
        />
      </body>
    </html>
  )
}
