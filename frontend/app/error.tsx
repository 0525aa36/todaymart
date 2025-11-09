'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 Sentry 등 사용)
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 에러 아이콘 */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* 메시지 */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">문제가 발생했습니다</h2>
          <p className="text-muted-foreground">
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              오류 코드: {error.digest}
            </p>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>

          <Button asChild variant="outline" size="lg">
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 가기
            </a>
          </Button>
        </div>

        {/* 추가 도움말 */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>문제가 지속되면 고객센터로 문의해주세요.</p>
          <a href="mailto:help.todaymart@gmail.com" className="text-primary hover:underline">
            help.todaymart@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
