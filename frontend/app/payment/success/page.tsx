"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, getErrorMessage } from "@/lib/api-client"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)

  const paymentKey = searchParams.get("paymentKey")
  const orderId = searchParams.get("orderId")
  const amount = searchParams.get("amount")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "로그인 필요",
        description: "결제 승인을 위해 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!paymentKey || !orderId || !amount) {
      toast({
        title: "잘못된 요청",
        description: "결제 정보가 올바르지 않습니다.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    confirmPayment()
  }, [paymentKey, orderId, amount])

  const confirmPayment = async () => {
    if (!paymentKey || !orderId || !amount) return

    try {
      await apiFetch("/api/payments/toss/confirm", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      })

      // 결제 완료 후 주문 완료 처리 (재고 차감, 장바구니 비우기)
      await apiFetch(`/api/orders/${orderId}/complete`, {
        method: "POST",
        auth: true,
      })

      setSuccess(true)
      toast({
        title: "결제 완료",
        description: "결제가 성공적으로 완료되었습니다.",
      })
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "결제 승인 실패",
        description: getErrorMessage(error, "결제 승인 중 오류가 발생했습니다. 고객센터에 문의해주세요."),
        variant: "destructive",
      })
      setSuccess(false)
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="pt-12 pb-12">
                <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">결제 승인 중</h2>
                <p className="text-muted-foreground">잠시만 기다려주세요...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">{success ? "결제가 완료되었습니다" : "결제 승인 실패"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {success ? (
                <>
                  <p className="text-muted-foreground">주문이 성공적으로 완료되었습니다.</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">주문번호</span>
                      <span className="font-semibold">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">결제금액</span>
                      <span className="font-semibold">{Number(amount).toLocaleString()}원</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                      홈으로
                    </Button>
                    <Button className="flex-1" onClick={() => router.push(`/mypage/orders/${orderId}`)}>
                      주문 상세보기
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    결제 승인에 실패했습니다.
                    <br />
                    고객센터로 문의해주세요.
                  </p>
                  <Button className="w-full mt-4" onClick={() => router.push("/")}>
                    홈으로
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
