"use client"

const DEFAULT_API_BASE_URL = "http://localhost:8081"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL

type ApiParseMode = "json" | "text" | "none" | "blob"

export interface ApiFetchOptions extends RequestInit {
  auth?: boolean
  parseResponse?: ApiParseMode
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

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = false, parseResponse = "json", headers, ...rest } = options

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
  })

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
    // 특정 HTTP 상태 코드에 따른 메시지
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
