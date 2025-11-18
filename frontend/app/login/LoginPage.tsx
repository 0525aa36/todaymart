"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { apiFetch, getErrorMessage, API_BASE_URL } from "@/lib/api-client"
import { setAuthToken } from "@/lib/token-manager"

export function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSocialLogin = (provider: "naver" | "kakao") => {
    // OAuth2 로그인 엔드포인트로 리다이렉트
    console.log(`[OAuth] Redirecting to: ${API_BASE_URL}/oauth2/authorization/${provider}`)
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("이메일과 비밀번호를 모두 입력해주세요.")
      return
    }

    setLoading(true)

    try {
      const data = await apiFetch<{
        token: string
        id: number
        email: string
        name: string
        roles: string[]
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      })

      // Store token in both localStorage and cookie for middleware
      setAuthToken(data.token)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          email: data.email,
          name: data.name,
          roles: data.roles,
        }),
      )

      toast.success(`${data.name}님, 환영합니다!`)

      router.push("/")
      setTimeout(() => (window.location.href = "/"), 100)
    } catch (error) {
      toast.error(getErrorMessage(error, "로그인 중 오류가 발생했습니다."))
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
            <div className="bg-card rounded-lg border p-8">
              <h1 className="text-2xl font-bold mb-2 text-center">로그인</h1>
              <p className="text-muted-foreground text-center mb-8">오늘마트에 오신 것을 환영합니다</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                      disabled={loading}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      로그인 상태 유지
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    비밀번호 찾기
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">또는 다른 방법으로 로그인</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* 네이버 로그인 */}
                  <Button
                    variant="outline"
                    className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A] hover:border-[#02B350]"
                    onClick={() => handleSocialLogin("naver")}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                    </svg>
                    네이버
                  </Button>
                  {/* 카카오 로그인 */}
                  <Button
                    variant="outline"
                    className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] border-[#FEE500] hover:border-[#FDD835]"
                    onClick={() => handleSocialLogin("kakao")}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.696.696 0 0 0-.653.447l-1.661 4.075a.472.472 0 0 0 .874.357l.33-.813h2.07l.299.8a.472.472 0 1 0 .884-.33l-.345-.926zM8.293 9.302a.472.472 0 0 0-.471-.472H4.577a.472.472 0 1 0 0 .944h1.16v3.736a.472.472 0 0 0 .944 0V9.774h1.14c.261 0 .472-.212.472-.472z" />
                    </svg>
                    카카오
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                아직 회원이 아니신가요?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

