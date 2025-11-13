"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { useState } from "react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { ArrowLeft, Mail } from "lucide-react"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("이메일을 입력해주세요.")
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })

      setSubmitted(true)
      toast.success(response.message || "임시 비밀번호가 이메일로 전송되었습니다.")
    } catch (error) {
      toast.error(getErrorMessage(error, "요청 처리 중 오류가 발생했습니다."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              로그인으로 돌아가기
            </Link>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
                <CardDescription>
                  {submitted
                    ? "이메일을 확인해주세요"
                    : "가입하신 이메일 주소를 입력해주세요"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-green-100 p-3">
                        <Mail className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-center text-sm font-medium">
                      이메일을 확인해주세요
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      <strong>{email}</strong>로 임시 비밀번호를 전송했습니다.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        📧 이메일이 도착하지 않았다면:<br />
                        • 스팸 메일함을 확인해주세요<br />
                        • 이메일 주소가 정확한지 확인해주세요<br />
                        • 5-10분 후에도 도착하지 않으면 다시 시도해주세요
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        ⚠️ 보안을 위해 로그인 후 <strong>반드시 비밀번호를 변경</strong>해주세요.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSubmitted(false)
                          setEmail("")
                        }}
                      >
                        다시 시도
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/login">로그인</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoFocus
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "처리 중..." : "재설정 링크 받기"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      입력하신 이메일로 비밀번호 재설정 링크를 전송해드립니다.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
