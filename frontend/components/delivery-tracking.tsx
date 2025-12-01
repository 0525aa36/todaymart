"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, MapPin, CheckCircle2, Home, RefreshCw, Phone, ExternalLink, X } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import {
  DeliveryTrackingResponse,
  getDeliveryLevelDescription,
  getCourierNameByCode,
} from "@/lib/courier-companies"

interface DeliveryTrackingProps {
  courierCode: string
  trackingNumber: string
  courierName?: string
  autoFetch?: boolean
  onClose?: () => void
}

// 배송 단계 정의
const DELIVERY_STEPS = [
  { level: 1, label: "상품인수", icon: Package },
  { level: 2, label: "상품이동중", icon: Truck },
  { level: 4, label: "배송지도착", icon: MapPin },
  { level: 5, label: "배송출발", icon: Truck },
  { level: 6, label: "배송완료", icon: Home },
]

// 에러 메시지 매핑 (사용자 친화적 메시지)
const ERROR_MESSAGES: Record<string, string> = {
  "동일한 운송장의 하루 요청 건수를 초과 하였습니다.": "네이버에서 배송 정보를 확인해보세요.",
  "API Key 없음": "네이버에서 배송 정보를 확인해보세요.",
  "운송장이 등록되지 않았거나 업체에서 상품을 준비중입니다.": "아직 배송 정보가 등록되지 않았습니다.",
  "해당 운송장을 조회할 수 없습니다.": "네이버에서 배송 정보를 확인해보세요.",
}

// 에러 메시지 변환
const getDisplayErrorMessage = (errorMessage: string | null): string => {
  if (!errorMessage) return "배송 정보를 조회할 수 없습니다."
  return ERROR_MESSAGES[errorMessage] || errorMessage
}

export function DeliveryTracking({ courierCode, trackingNumber, courierName, autoFetch = true, onClose }: DeliveryTrackingProps) {
  const [trackingData, setTrackingData] = useState<DeliveryTrackingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<boolean>(false)

  const fetchTrackingInfo = async () => {
    if (!courierCode || !trackingNumber) {
      setError("택배사 코드와 송장번호가 필요합니다.")
      return
    }

    setLoading(true)
    setError(null)
    setApiError(false)
    setTrackingData(null)

    try {
      const data = await apiFetch<DeliveryTrackingResponse>(
        `/api/delivery/tracking?courierCode=${courierCode}&trackingNumber=${trackingNumber}`
      )

      if (!data.success) {
        setError(getDisplayErrorMessage(data.errorMessage))
        setApiError(true)
        return
      }

      if (!data.trackingDetails || data.trackingDetails.length === 0) {
        if (data.level === 0) {
          setError("아직 배송 정보가 등록되지 않았습니다.")
          setApiError(true)
          return
        }
      }

      setTrackingData(data)
    } catch (err) {
      const errorMsg = getErrorMessage(err, "배송 정보를 조회할 수 없습니다.")
      setError(getDisplayErrorMessage(errorMsg))
      setApiError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && courierCode && trackingNumber) {
      fetchTrackingInfo()
    }
  }, [courierCode, trackingNumber, autoFetch])

  const displayCourierName = courierName || getCourierNameByCode(courierCode)
  const naverTrackingUrl = `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(displayCourierName + ' ' + trackingNumber)}`

  const getCurrentStepIndex = (level: number) => {
    if (level >= 6) return 4
    if (level >= 5) return 3
    if (level >= 4) return 2
    if (level >= 2) return 1
    return 0
  }

  const currentStepIndex = trackingData ? getCurrentStepIndex(trackingData.level) : -1

  return (
    <div className="bg-white rounded-lg overflow-y-auto max-h-[85vh] sm:max-h-[80vh]">
      {/* 헤더 - 메인 컬러 배경, sticky로 고정 */}
      <div className="p-4 sticky top-0 z-10" style={{ backgroundColor: '#23747C' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              {displayCourierName}
            </Badge>
            <span className="font-mono font-bold text-white">{trackingNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTrackingInfo}
              disabled={loading}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1">
        {/* 로딩 */}
        {loading && (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: '#23747C' }} />
            <p className="text-sm text-gray-500">배송 정보를 조회하고 있습니다...</p>
          </div>
        )}

        {/* 에러 표시 */}
        {error && !loading && (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F4F5' }}>
                <Truck className="h-8 w-8" style={{ color: '#23747C' }} />
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>
          </div>
        )}

        {/* 배송 정보 */}
        {trackingData && trackingData.success && !loading && (
          <div className="p-4">
            {/* 배송 정보 박스 */}
            <div className="border rounded-lg overflow-hidden">
              {/* 배송 단계 표시 */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
                  <div
                    className="absolute top-5 left-0 h-0.5 transition-all duration-500"
                    style={{
                      width: `${(currentStepIndex / 4) * 100}%`,
                      backgroundColor: '#23747C'
                    }}
                  />

                  {DELIVERY_STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex

                    return (
                      <div key={step.level} className="flex flex-col items-center relative z-10">
                        <div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${isCompleted
                              ? "text-white shadow-lg"
                              : "bg-white text-gray-400 border-2 border-gray-200"
                            }
                          `}
                          style={isCompleted ? {
                            backgroundColor: '#23747C',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(35, 116, 124, 0.2)' : undefined
                          } : undefined}
                        >
                          {isCompleted && index < currentStepIndex ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <span
                          className="text-xs mt-2 font-medium whitespace-nowrap"
                          style={{ color: isCompleted ? '#23747C' : '#9CA3AF' }}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 현재 상태 요약 */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-full"
                    style={{
                      backgroundColor: '#E8F4F5',
                      color: '#23747C'
                    }}
                  >
                    {trackingData.complete ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Truck className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {trackingData.levelDescription || getDeliveryLevelDescription(trackingData.level)}
                    </p>
                    {trackingData.trackingDetails && trackingData.trackingDetails.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {trackingData.trackingDetails[0].timeString || trackingData.trackingDetails[0].time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 배송 이력 타임라인 */}
              {trackingData.trackingDetails && trackingData.trackingDetails.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">배송 상세이력</h3>

                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />

                    <div className="space-y-4">
                      {trackingData.trackingDetails.map((detail, index) => {
                        const isFirst = index === 0
                        const location = detail.location || detail.where
                        const status = detail.status || detail.kind
                        const phone = detail.telNo || detail.telno
                        const time = detail.timeString || detail.time

                        return (
                          <div key={index} className="relative flex gap-4 pl-6">
                            <div
                              className="absolute left-0 w-4 h-4 rounded-full border-2"
                              style={isFirst ? {
                                backgroundColor: '#23747C',
                                borderColor: '#23747C'
                              } : {
                                backgroundColor: 'white',
                                borderColor: '#D1D5DB'
                              }}
                            >
                              {isFirst && (
                                <div
                                  className="absolute inset-0 rounded-full animate-ping opacity-25"
                                  style={{ backgroundColor: '#23747C' }}
                                />
                              )}
                            </div>

                            <div className={`flex-1 pb-4 ${isFirst ? "" : "opacity-70"}`}>
                              <div className="text-xs text-gray-500 mb-1">
                                {time}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="font-medium"
                                  style={{ color: isFirst ? '#23747C' : '#374151' }}
                                >
                                  {status}
                                </span>
                                {location && (
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {location}
                                  </span>
                                )}
                              </div>

                              {phone && (
                                <a
                                  href={`tel:${phone}`}
                                  className="inline-flex items-center gap-1 mt-1 text-xs hover:underline"
                                  style={{ color: '#23747C' }}
                                >
                                  <Phone className="h-3 w-3" />
                                  {phone}
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 초기 상태 */}
        {!trackingData && !error && !loading && (
          <div className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">배송 정보를 조회해주세요</p>
            <Button
              onClick={fetchTrackingInfo}
              style={{ backgroundColor: '#23747C' }}
              className="hover:opacity-90"
            >
              배송 조회하기
            </Button>
          </div>
        )}
      </div>

      {/* 푸터 - 네이버 배송조회, sticky bottom으로 고정 */}
      <div className="p-4 bg-gray-50 border-t sticky bottom-0 z-10">
        <a
          href={naverTrackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#23747C]"
        >
          <ExternalLink className="h-4 w-4" />
          네이버에서 상세 조회
        </a>
      </div>
    </div>
  )
}
