"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

declare global {
  interface Window {
    daum: any
  }
}

interface AddressSearchProps {
  onComplete: (data: { zonecode: string; address: string; addressDetail?: string }) => void
  className?: string
  buttonText?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg"
}

export function AddressSearch({
  onComplete,
  className,
  buttonText = "주소 검색",
  variant = "outline",
  size = "default",
}: AddressSearchProps) {
  const handleSearch = () => {
    if (typeof window === "undefined" || !window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.")
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 또는 지번 주소를 선택
        const fullAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress

        onComplete({
          zonecode: data.zonecode,
          address: fullAddress,
          addressDetail: data.buildingName ? `(${data.buildingName})` : "",
        })
      },
    }).open()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSearch}
      className={className}
    >
      <Search className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  )
}
