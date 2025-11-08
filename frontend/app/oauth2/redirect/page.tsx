"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api-client"

/**
 * OAuth2 로그인 성공 후 리다이렉트 처리 페이지
 * 백엔드에서 JWT 토큰을 쿼리 파라미터로 전달받아 localStorage에 저장
 */
export default function OAuth2RedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const token = searchParams.get("token")
    const error = searchParams.get("error")

    if (error) {
      // 로그인 실패
      toast({
        title: "소셜 로그인 실패",
        description: decodeURIComponent(error),
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (token) {
      // JWT 토큰 저장
      localStorage.setItem("token", token)

      // 사용자 정보 가져오기
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((userData) => {
          // 사용자 정보 저장
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              roles: userData.roles,
            })
          )

          // 토스트 메시지
          toast({
            title: "로그인 성공",
            description: `${userData.name}님, 환영합니다!`,
          })

          // 전체 페이지 새로고침으로 헤더가 토큰을 감지하도록 함
          setTimeout(() => {
            window.location.href = "/"
          }, 500)
        })
        .catch((error) => {
          console.error("Failed to fetch user info:", error)
          toast({
            title: "로그인 오류",
            description: "사용자 정보를 가져올 수 없습니다.",
            variant: "destructive",
          })
          router.push("/login")
        })
    } else {
      // 토큰도 에러도 없는 경우
      toast({
        title: "로그인 오류",
        description: "소셜 로그인 중 문제가 발생했습니다.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [searchParams, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  )
}
