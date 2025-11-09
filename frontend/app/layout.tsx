import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '오늘마트 - 농수산물 직송 쇼핑몰',
  description: '신선한 농수산물을 농가에서 직접 배송받으세요',
  generator: 'v0.app',
  icons: {
    icon: '/logo_todaymart.png',
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
        <script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          async
        />
      </head>
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
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
          }}
        />
      </body>
    </html>
  )
}
