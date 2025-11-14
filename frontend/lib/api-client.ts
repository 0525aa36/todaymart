"use client"

const DEFAULT_API_BASE_URL = "http://localhost:8081"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL

type ApiParseMode = "json" | "text" | "none" | "blob"

export interface ApiFetchOptions extends RequestInit {
  auth?: boolean
  parseResponse?: ApiParseMode
  skipRefresh?: boolean // 리프레시 재시도 방지
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

// 리프레시 토큰 갱신 상태 관리
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = false, parseResponse = "json", skipRefresh = false, headers, ...rest } = options

  const url = buildUrl(path)
  const finalHeaders = new Headers(headers ?? {})

  if (!(rest.body instanceof FormData) && !finalHeaders.has("Content-Type") && rest.body !== undefined) {
    finalHeaders.set("Content-Type", "application/json")
  }

  finalHeaders.set("Accept", "application/json")

  if (auth) {
    let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      // Remove "Bearer " prefix if it exists
      if (token.startsWith("Bearer ")) {
        token = token.slice(7)
      }
      if (!finalHeaders.has("Authorization")) {
        finalHeaders.set("Authorization", `Bearer ${token}`)
      }
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: "include", // 쿠키를 포함하여 전송 (리프레시 토큰)
  })

  // 401 에러 발생 시 자동 토큰 갱신 시도
  if (response.status === 401 && auth && !skipRefresh && typeof window !== "undefined") {
    console.log("[API Client] 401 Unauthorized - 토큰 갱신 시도")

    const newToken = await refreshAccessToken()

    if (newToken) {
      // 새 토큰으로 원래 요청 재시도
      console.log("[API Client] 토큰 갱신 성공 - 요청 재시도")
      return apiFetch<T>(path, { ...options, skipRefresh: true }) // 무한 루프 방지
    } else {
      // 리프레시 실패 - 로그아웃 처리
      console.log("[API Client] 토큰 갱신 실패 - 로그아웃")
      handleLogout()
      const payload = await extractPayload(response)
      const message = extractErrorMessage(response.status, payload)
      throw new ApiError(response.status, message, payload)
    }
  }

  if (!response.ok) {
    const payload = await extractPayload(response)
    const message = extractErrorMessage(response.status, payload)
    throw new ApiError(response.status, message, payload)
  }

  if (parseResponse === "none" || response.status === 204) {
    return undefined as T
  }

  if (parseResponse === "text") {
    return (await response.text()) as T
  }

  if (parseResponse === "blob") {
    return (await response.blob()) as T
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * 리프레시 토큰으로 새로운 액세스 토큰 발급
 * 동시에 여러 요청이 401을 받아도 한 번만 리프레시 요청
 */
async function refreshAccessToken(): Promise<string | null> {
  // 이미 리프레시 중이면 대기
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include", // httpOnly 쿠키 포함
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("[API Client] 리프레시 토큰 갱신 실패:", response.status)
        return null
      }

      const data = await response.json()
      const newToken = data.token

      if (newToken && typeof window !== "undefined") {
        // 새 액세스 토큰 저장
        localStorage.setItem("token", newToken)
        console.log("[API Client] 새 액세스 토큰 저장 완료")
        return newToken
      }

      return null
    } catch (error) {
      console.error("[API Client] 리프레시 토큰 갱신 중 에러:", error)
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * 로그아웃 처리 (토큰 삭제 및 로그인 페이지 이동)
 */
function handleLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    // 로그인 페이지로 리다이렉트
    window.location.href = "/login"
  }
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`
  }

  return `${API_BASE_URL}/${path}`
}

function extractErrorMessage(status: number, payload: unknown): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  return `요청이 실패했습니다. (HTTP ${status})`
}

async function extractPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  try {
    if (contentType.includes("application/json")) {
      return await response.json()
    }
    return await response.text()
  } catch {
    return null
  }
}

export function getErrorMessage(error: unknown, fallback = "오류가 발생했습니다."): string {
  if (error instanceof ApiError) {
    // 백엔드에서 온 구체적인 메시지가 있으면 우선 표시
    if (error.message && error.message.length > 0 && !error.message.startsWith("요청이 실패했습니다")) {
      return error.message
    }

    // 구체적인 메시지가 없을 때만 상태 코드별 기본 메시지 사용
    switch (error.status) {
      case 401:
        return "로그인이 필요합니다."
      case 403:
        return "접근 권한이 없습니다."
      case 404:
        return "요청한 리소스를 찾을 수 없습니다."
      case 500:
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      default:
        return error.message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
