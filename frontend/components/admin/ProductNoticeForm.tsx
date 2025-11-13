"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface ProductNoticeData {
  productName: string
  foodType: string
  manufacturer: string
  expirationInfo: string
  capacity: string
  ingredients: string
  nutritionFacts: string
  gmoInfo: string
  safetyWarnings: string
  importDeclaration: string
  customerServicePhone: string
}

interface ProductNoticeFormProps {
  data: ProductNoticeData
  onChange: (data: ProductNoticeData) => void
}

const NOTICE_FIELDS = [
  { key: "productName", label: "제품명", placeholder: "예: 유기농 토마토" },
  { key: "foodType", label: "식품의 유형", placeholder: "예: 농산물(토마토)" },
  { key: "manufacturer", label: "생산자 및 소재지", placeholder: "예: OO농장, 경기도 이천시" },
  { key: "expirationInfo", label: "제조연월일, 소비기한 또는 품질유지기한", placeholder: "예: 별도 표기" },
  { key: "capacity", label: "포장단위별 내용물의 용량(중량), 수량", placeholder: "예: 1kg" },
  {
    key: "ingredients",
    label: "원재료명 및 함량",
    placeholder: "예: 토마토 100% (국산)",
    multiline: true,
  },
  {
    key: "nutritionFacts",
    label: "영양성분",
    placeholder: "예: 100g당 - 열량 18kcal, 탄수화물 4g, ...",
    multiline: true,
  },
  { key: "gmoInfo", label: "유전자변형식품 표시", placeholder: "예: 해당없음" },
  {
    key: "safetyWarnings",
    label: "소비자 안전을 위한 주의사항",
    placeholder: "예: 직사광선을 피하여 보관하세요.",
    multiline: true,
  },
  { key: "importDeclaration", label: "수입식품 수입신고 문구", placeholder: "예: 해당없음 (국내산)" },
  { key: "customerServicePhone", label: "소비자 상담 전화번호", placeholder: "예: 1577-1234" },
] as const

export function ProductNoticeForm({ data, onChange }: ProductNoticeFormProps) {
  const handleChange = (key: keyof ProductNoticeData, value: string) => {
    onChange({
      ...data,
      [key]: value,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">상품 고시 정보 (전자상거래법 준수)</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          전자상거래법에 따라 소비자에게 제공해야 하는 상품 정보입니다.
          <br />
          각 항목을 정확히 입력해주세요. 정보가 없는 경우 &quot;상품설명 참조&quot; 또는 &quot;해당없음&quot;을 입력하세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTICE_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              <span className="text-muted-foreground text-xs ml-2">(필수)</span>
            </Label>
            {field.multiline ? (
              <Textarea
                id={field.key}
                placeholder={field.placeholder}
                value={data[field.key as keyof ProductNoticeData]}
                onChange={(e) => handleChange(field.key as keyof ProductNoticeData, e.target.value)}
                rows={3}
                className="resize-none"
              />
            ) : (
              <Input
                id={field.key}
                type="text"
                placeholder={field.placeholder}
                value={data[field.key as keyof ProductNoticeData]}
                onChange={(e) => handleChange(field.key as keyof ProductNoticeData, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="bg-muted p-4 rounded-lg mt-6">
          <p className="text-sm font-medium mb-2">💡 작성 가이드</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>정확한 정보를 입력하여 소비자 신뢰를 확보하세요.</li>
            <li>정보가 없거나 상품 설명에 포함된 경우 &quot;상품설명 및 상품이미지 참조&quot;를 입력하세요.</li>
            <li>해당사항이 없는 경우 &quot;해당없음&quot;을 입력하세요.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
