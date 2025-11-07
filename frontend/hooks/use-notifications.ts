"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api-client"

interface Notification {
  title: string
  message: string
  type: string
}

export function useNotifications(isAdmin?: boolean) {
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // 관리자가 아니면 SSE 연결하지 않음
    if (!isAdmin) {
      console.log("일반 사용자: 알림 비활성화")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    console.log("관리자 알림 설정 중...")

    // 백엔드 서버로 직접 연결
    const eventSource = new EventSource(`${API_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`)

    eventSourceRef.current = eventSource

    // 연결 성공
    eventSource.addEventListener("connected", (event) => {
      console.log("관리자 SSE 연결됨:", event.data)
      toast.success("관리자 알림 활성화", {
        description: "새로운 주문이 오면 실시간으로 알려드립니다",
        duration: 3000,
      })
    })

    // 알림 수신
    eventSource.addEventListener("notification", (event) => {
      try {
        const notification: Notification = JSON.parse(event.data)
        console.log("Received notification:", notification)

        // 알림 타입에 따른 토스트 표시
        switch (notification.type) {
          case "ORDER_STATUS_CHANGED":
            toast.info(notification.title, {
              description: notification.message,
              duration: 4000
            })
            break
          case "DELIVERY_STARTED":
            toast.success(notification.title, {
              description: notification.message,
              duration: 4000
            })
            break
          case "STOCK_LOW":
            toast.warning(notification.title, {
              description: notification.message,
              duration: 6000
            })
            break
          case "NEW_ORDER":
            toast.success(notification.title, {
              description: notification.message,
              duration: 8000, // 새 주문 알림은 더 오래 표시
            })
            // 페이지 새로고침을 트리거하기 위한 이벤트 발생
            window.dispatchEvent(new CustomEvent('new-order'))
            break
          case "SYSTEM":
            toast(notification.title, {
              description: notification.message,
              duration: 4000
            })
            break
          default:
            toast(notification.title, {
              description: notification.message,
              duration: 4000
            })
        }
      } catch (error) {
        console.error("알림 파싱 오류:", error)
      }
    })

    // 에러 처리
    eventSource.onerror = (error) => {
      console.error("SSE 연결 오류:", error)
      eventSource.close()
    }

    // 정리
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isAdmin])

  // 테스트 알림 전송 함수
  const sendTestNotification = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await fetch(`${API_BASE_URL}/api/notifications/test`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
    } catch (error) {
      console.error("테스트 알림 전송 실패:", error)
    }
  }

  return { sendTestNotification }
}
