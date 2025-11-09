import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ShoppingCart } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 숫자 */}
        <h1 className="text-9xl font-bold text-primary/20">404</h1>

        {/* 메시지 */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">페이지를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 가기
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              상품 검색
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/cart">
              <ShoppingCart className="mr-2 h-4 w-4" />
              장바구니
            </Link>
          </Button>
        </div>

        {/* 추가 도움말 */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>도움이 필요하신가요?</p>
          <Link href="/mypage" className="text-primary hover:underline">
            고객센터 문의하기
          </Link>
        </div>
      </div>
    </div>
  )
}
