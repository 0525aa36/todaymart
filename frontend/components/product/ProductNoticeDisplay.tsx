"use client"

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
    <div className="border-t pt-9">
      {/* Kurly-style heading */}
      <h2
        className="text-center text-[28px] font-bold mb-9"
        style={{ letterSpacing: '-0.5px' }}
      >
        상품 고시 정보
      </h2>

      {Object.values(notice).every((v) => !v) ? (
        <div className="text-center py-8" style={{ color: '#666', fontSize: '13px' }}>
          등록된 상품 고시 정보가 없습니다.
        </div>
      ) : (
        <div className="space-y-0">
          {NOTICE_FIELDS.map((field) => {
            const value = notice[field.key as keyof ProductNoticeData]
            if (!value) return null

            return (
              <div
                key={field.key}
                className="flex border-t first:border-t-0"
                style={{ minHeight: '48px' }}
              >
                {/* Label with gray background */}
                <div
                  className="flex items-center px-4 py-[18px] break-words"
                  style={{
                    backgroundColor: '#f7f7f7',
                    width: '30%',
                    minWidth: '200px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#333',
                    letterSpacing: '-0.5px',
                    lineHeight: '18px'
                  }}
                >
                  {field.label}
                </div>

                {/* Value */}
                <div
                  className="flex-1 px-4 py-[18px] break-words whitespace-pre-wrap"
                  style={{
                    fontSize: '13px',
                    color: '#333',
                    letterSpacing: '-0.5px',
                    lineHeight: '18px'
                  }}
                >
                  {value}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
