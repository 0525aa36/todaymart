"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { apiFetch, API_BASE_URL, getErrorMessage } from "@/lib/api-client"

interface Seller {
  id: number
  name: string
  businessNumber: string
  representative: string
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeSellers, setActiveSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    origin: "",
    description: "",
    price: "",
    discountRate: "",
    stock: "",
    imageUrl: "",
    sellerId: "",
    supplyPrice: "",
    shippingFee: "3000",
    canCombineShipping: false,
    combineShippingUnit: "",
    courierCompany: "",
    minOrderQuantity: "1",
    maxOrderQuantity: "",
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [descriptionImages, setDescriptionImages] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "접근 권한 없음",
        description: "관리자 로그인이 필요합니다.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    fetchActiveSellers()
  }, [])

  const fetchActiveSellers = async () => {
    try {
      const data = await apiFetch<Seller[]>("/api/admin/sellers/active", {
        auth: true,
      })
      setActiveSellers(data)
    } catch (error) {
      console.error("Error fetching active sellers:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "판매자 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append("files", file)
      })

      const data = await apiFetch<{ fileUrls: string[] }>("/api/files/upload-multiple", {
        method: "POST",
        body: formData,
        auth: true,
      })

      const fileUrls = data.fileUrls.map((url: string) =>
        url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url}`
      )
      setUploadedImages((prev) => [...prev, ...fileUrls])
      toast({
        title: "업로드 완료",
        description: `${files.length}개의 이미지가 업로드되었습니다.`,
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "이미지 업로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDescriptionImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append("files", file)
      })

      const data = await apiFetch<{ fileUrls: string[] }>("/api/files/upload-multiple", {
        method: "POST",
        body: formData,
        auth: true,
      })

      const fileUrls = data.fileUrls.map((url: string) =>
        url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url}`
      )
      setDescriptionImages((prev) => [...prev, ...fileUrls])

      const imageMarkdown = fileUrls.map((url: string) => `![이미지](${url})`).join("\n")
      setFormData((prev) => ({
        ...prev,
        description: prev.description + (prev.description ? "\n\n" : "") + imageMarkdown,
      }))

      toast({
        title: "업로드 완료",
        description: `${files.length}개의 이미지가 설명에 추가되었습니다.`,
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "이미지 업로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return

    setLoading(true)

    const productData = {
      name: formData.name,
      category: formData.category,
      origin: formData.origin,
      description: formData.description,
      price: parseFloat(formData.price),
      discountRate: formData.discountRate ? parseFloat(formData.discountRate) : null,
      stock: parseInt(formData.stock),
      imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : (formData.imageUrl || null),
      imageUrls: uploadedImages.length > 0 ? uploadedImages.join(',') : null,
      sellerId: formData.sellerId ? parseInt(formData.sellerId) : null,
      supplyPrice: formData.supplyPrice ? parseFloat(formData.supplyPrice) : null,
      shippingFee: parseFloat(formData.shippingFee),
      canCombineShipping: formData.canCombineShipping,
      combineShippingUnit: formData.combineShippingUnit ? parseInt(formData.combineShippingUnit) : null,
      courierCompany: formData.courierCompany || null,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
    }

    try {
      await apiFetch("/api/admin/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify(productData),
        parseResponse: "none",
      })

      toast({
        title: "등록 완료",
        description: "상품이 성공적으로 등록되었습니다.",
      })
      router.push("/admin/products")
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 저장 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">새 상품 등록</h1>
          <p className="text-sm text-gray-500 mt-1">판매할 상품 정보를 입력하세요</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>상품 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-gray-700 border-b pb-2">기본 정보</h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">상품명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="예: 제주 감귤 3kg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">카테고리 *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      placeholder="예: 과일"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="origin">원산지 *</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      required
                      placeholder="예: 제주"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sellerId">판매자 (선택)</Label>
                  <select
                    id="sellerId"
                    value={formData.sellerId}
                    onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">직매 (판매자 없음)</option>
                    {activeSellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name} ({seller.businessNumber})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    판매자를 선택하지 않으면 직매 상품으로 등록됩니다
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">상품 설명 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={5}
                    placeholder="상품에 대한 상세 설명을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 가격 및 재고 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-gray-700 border-b pb-2">가격 및 재고</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">가격 (원) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    placeholder="19900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discountRate">할인율 (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">재고 *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    min="0"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplyPrice">공급가 (원)</Label>
                  <Input
                    id="supplyPrice"
                    type="number"
                    value={formData.supplyPrice}
                    onChange={(e) => setFormData({ ...formData, supplyPrice: e.target.value })}
                    min="0"
                    placeholder="도매가 입력 (선택)"
                  />
                </div>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-gray-700 border-b pb-2">배송 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shippingFee">배송비 (원) *</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    value={formData.shippingFee}
                    onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                    required
                    min="0"
                    placeholder="3000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="courierCompany">택배사</Label>
                  <Input
                    id="courierCompany"
                    value={formData.courierCompany}
                    onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                    placeholder="예: CJ대한통운, 로젠택배"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="canCombineShipping"
                    checked={formData.canCombineShipping}
                    onChange={(e) => setFormData({ ...formData, canCombineShipping: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="canCombineShipping" className="cursor-pointer">합포장 가능</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="combineShippingUnit">합포장 단위</Label>
                  <Input
                    id="combineShippingUnit"
                    type="number"
                    value={formData.combineShippingUnit}
                    onChange={(e) => setFormData({ ...formData, combineShippingUnit: e.target.value })}
                    min="1"
                    placeholder="예: 5개씩"
                    disabled={!formData.canCombineShipping}
                  />
                </div>
              </div>
            </div>

            {/* 주문 수량 설정 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-gray-700 border-b pb-2">주문 수량 설정</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minOrderQuantity">최소 주문 수량 *</Label>
                  <Input
                    id="minOrderQuantity"
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })}
                    required
                    min="1"
                    placeholder="1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxOrderQuantity">최대 주문 수량</Label>
                  <Input
                    id="maxOrderQuantity"
                    type="number"
                    value={formData.maxOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value })}
                    min="1"
                    placeholder="제한 없음"
                  />
                  <p className="text-xs text-muted-foreground">비워두면 제한 없음</p>
                </div>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-gray-700 border-b pb-2">이미지</h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productImages">
                    상품 이미지 (여러 장 업로드 가능)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="productImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && <span className="text-sm text-gray-500">업로드 중...</span>}
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`상품 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              대표
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    첫 번째 이미지가 대표 이미지로 사용됩니다.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descriptionImages">상품 설명 이미지</Label>
                  <Input
                    id="descriptionImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleDescriptionImageUpload(e.target.files)}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    이미지가 자동으로 설명에 추가됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Link href="/admin/products">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    등록 중...
                  </>
                ) : (
                  "상품 등록"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
