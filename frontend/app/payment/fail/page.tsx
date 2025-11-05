"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function PaymentFailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorCode = searchParams.get("code")
  const errorMessage = searchParams.get("message")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">결제에 실패했습니다</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">결제 처리 중 문제가 발생했습니다.</p>
              {errorMessage && (
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">오류 메시지:</p>
                  <p className="font-medium">{errorMessage}</p>
                  {errorCode && <p className="text-xs text-muted-foreground mt-2">오류 코드: {errorCode}</p>}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                  홈으로
                </Button>
                <Button className="flex-1" onClick={() => router.back()}>
                  다시 시도
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
