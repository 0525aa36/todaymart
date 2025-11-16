import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminLoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
  type?: "full-page" | "table" | "inline"
  className?: string
}

export function AdminLoadingSpinner({
  message = "데이터를 불러오는 중...",
  size = "md",
  type = "full-page",
  className,
}: AdminLoadingSpinnerProps) {
  const containerClasses = {
    "full-page": "flex items-center justify-center py-12",
    table: "flex justify-center py-8",
    inline: "flex items-center gap-2",
  }

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn(containerClasses[type], className)}>
      <div className="text-center">
        <Loader2
          className={cn(
            sizeClasses[size],
            "animate-spin mx-auto"
          )}
          style={{ color: "#23747C" }}
        />
        {message && type !== "inline" && (
          <p className="mt-4 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

// 로딩 메시지 상수
export const LOADING_MESSAGES = {
  DATA: "데이터를 불러오는 중...",
  SAVE: "저장 중...",
  DELETE: "삭제 중...",
  SYNC: "동기화 중...",
  EXPORT: "내보내는 중...",
  UPLOAD: "업로드 중...",
  PROCESS: "처리 중...",
} as const
