"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface ProductNoticeData {
  productName?: string
  foodType?: string
  manufacturer?: string
  expirationInfo?: string
  capacity?: string
  ingredients?: string
  nutritionFacts?: string
  gmoInfo?: string
  safetyWarnings?: string
  importDeclaration?: string
  customerServicePhone?: string
}

interface ProductNoticeDisplayProps {
  notice: ProductNoticeData
}

const NOTICE_FIELDS = [
  { key: "productName", label: "제품명" },
  { key: "foodType", label: "식품의 유형" },
  { key: "manufacturer", label: "생산자 및 소재지 (수입품의 경우 생산자, 수입자 및 제조국)" },
  { key: "expirationInfo", label: "제조연월일, 소비기한 또는 품질유지기한" },
  { key: "capacity", label: "포장단위별 내용물의 용량(중량), 수량" },
  { key: "ingredients", label: "원재료명 및 함량" },
  { key: "nutritionFacts", label: "영양성분" },
  { key: "gmoInfo", label: "유전자변형식품에 해당하는 경우의 표시" },
  { key: "safetyWarnings", label: "소비자 안전을 위한 주의사항" },
  { key: "importDeclaration", label: "수입식품의 경우 수입신고 필함 문구" },
  { key: "customerServicePhone", label: "소비자 상담 관련 전화번호" },
] as const

export function ProductNoticeDisplay({ notice }: ProductNoticeDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">상품 고시 정보</CardTitle>
        <p className="text-sm text-muted-foreground">
          전자상거래법에 따른 상품 정보 제공 고시
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {NOTICE_FIELDS.map((field) => {
            const value = notice[field.key as keyof ProductNoticeData]
            if (!value) return null

            return (
              <li key={field.key} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="font-medium text-sm text-muted-foreground mb-1">{field.label}</div>
                <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
              </li>
            )
          })}
        </ul>

        {Object.values(notice).every((v) => !v) && (
          <div className="text-center text-muted-foreground py-8">
            등록된 상품 고시 정보가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
