"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { apiFetch, API_BASE_URL, getErrorMessage } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"

interface Seller {
  id: number
  name: string
}

interface ProductOption {
  id: number
  optionName: string
  optionValue: string
  additionalPrice: number
  stock: number
  isAvailable: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const productId = params.id as string

  const [activeSellers, setActiveSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)

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
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)

  // Options state
  const [options, setOptions] = useState<ProductOption[]>([])
  const [newOption, setNewOption] = useState({
    optionName: "",
    optionValue: "",
    additionalPrice: "0",
    stock: "0",
    isAvailable: true,
  })
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)

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
    fetchProduct()
    fetchOptions()
  }, [productId])

  const fetchActiveSellers = async () => {
    try {
      const data = await apiFetch<Seller[]>("/api/admin/sellers/active", { auth: true })
      setActiveSellers(data)
    } catch (error) {
      console.error("Error fetching sellers:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const product = await apiFetch<any>(`/api/products/${productId}`)
      setFormData({
        name: product.name || "",
        category: product.category || "",
        origin: product.origin || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        discountRate: product.discountRate?.toString() || "",
        stock: product.stock?.toString() || "",
        imageUrl: product.imageUrl || "",
        sellerId: product.seller?.id?.toString() || "",
        supplyPrice: product.supplyPrice?.toString() || "",
        shippingFee: product.shippingFee?.toString() || "3000",
        canCombineShipping: product.canCombineShipping || false,
        combineShippingUnit: product.combineShippingUnit?.toString() || "",
        courierCompany: product.courierCompany || "",
        minOrderQuantity: product.minOrderQuantity?.toString() || "1",
        maxOrderQuantity: product.maxOrderQuantity?.toString() || "",
      })

      if (product.imageUrls) {
        setUploadedImages(product.imageUrls.split(','))
      } else if (product.imageUrl) {
        setUploadedImages([product.imageUrl])
      }

      if (product.detailImageUrls) {
        setDetailImages(product.detailImageUrls.split(','))
      }
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 정보를 불러올 수 없습니다."),
        variant: "destructive",
      })
    } finally {
      setLoadingProduct(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const data = await apiFetch<ProductOption[]>(`/api/products/${productId}/options`)
      setOptions(data)
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))

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
        description: `${files.length}개의 메인 이미지가 업로드되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "이미지 업로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDetailImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingDetail(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))

      const data = await apiFetch<{ fileUrls: string[] }>("/api/files/upload-multiple", {
        method: "POST",
        body: formData,
        auth: true,
      })

      const fileUrls = data.fileUrls.map((url: string) =>
        url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url}`
      )
      setDetailImages((prev) => [...prev, ...fileUrls])

      toast({
        title: "업로드 완료",
        description: `${files.length}개의 상세 이미지가 업로드되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "이미지 업로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUploadingDetail(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const removeDetailImage = (index: number) => {
    setDetailImages(detailImages.filter((_, i) => i !== index))
  }

  const handleAddOption = async () => {
    if (!newOption.optionName || !newOption.optionValue) {
      toast({
        title: "입력 오류",
        description: "옵션명과 옵션값을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      await apiFetch(`/api/admin/products/${productId}/options`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          optionName: newOption.optionName,
          optionValue: newOption.optionValue,
          additionalPrice: parseFloat(newOption.additionalPrice),
          stock: parseInt(newOption.stock),
          isAvailable: newOption.isAvailable,
        }),
        parseResponse: "none",
      })

      setNewOption({
        optionName: "",
        optionValue: "",
        additionalPrice: "0",
        stock: "0",
        isAvailable: true,
      })

      toast({
        title: "옵션 추가됨",
        description: "옵션이 성공적으로 추가되었습니다.",
      })

      fetchOptions()
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "옵션 추가 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm("이 옵션을 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/admin/products/${productId}/options/${optionId}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "삭제 완료",
        description: "옵션이 삭제되었습니다.",
      })

      fetchOptions()
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "옵션 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      detailImageUrls: detailImages.length > 0 ? detailImages.join(',') : null,
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
      await apiFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(productData),
        parseResponse: "none",
      })

      toast({
        title: "수정 완료",
        description: "상품이 성공적으로 수정되었습니다.",
      })

      router.push("/admin/products")
    } catch (error) {
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 수정 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">상품 수정</h1>
          <p className="text-sm text-gray-500 mt-1">상품 정보와 옵션을 수정하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info & Options */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보 & 옵션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">상품명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">카테고리 *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="origin">원산지 *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">상품 설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">판매가 (원) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="discountRate">할인율 (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">재고 *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="sellerId">판매자</Label>
                  <select
                    id="sellerId"
                    value={formData.sellerId}
                    onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">선택하세요</option>
                    {activeSellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options in Left Column */}
              <div className="pt-4 border-t">
                <Label className="text-base font-semibold">상품 옵션</Label>
                <div className="mt-3 space-y-3">
                  {/* Existing Options */}
                  {options.length > 0 && (
                    <div className="space-y-2">
                      {options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1">
                            <span className="font-medium">{option.optionName}:</span> {option.optionValue}
                            <span className="text-gray-500 ml-2">{option.additionalPrice >= 0 ? '+' : ''}{option.additionalPrice}원</span>
                            <span className="text-gray-500 ml-2">재고 {option.stock}개</span>
                            <Badge variant={option.isAvailable ? "default" : "secondary"} className="ml-2 text-xs">
                              {option.isAvailable ? "판매중" : "중지"}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Option - Compact */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="optionName" className="text-xs">옵션명</Label>
                        <Input
                          id="optionName"
                          value={newOption.optionName}
                          onChange={(e) => setNewOption({ ...newOption, optionName: e.target.value })}
                          placeholder="예: 크기"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="optionValue" className="text-xs">옵션값</Label>
                        <Input
                          id="optionValue"
                          value={newOption.optionValue}
                          onChange={(e) => setNewOption({ ...newOption, optionValue: e.target.value })}
                          placeholder="예: 대"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="additionalPrice" className="text-xs">추가금액</Label>
                        <Input
                          id="additionalPrice"
                          type="number"
                          value={newOption.additionalPrice}
                          onChange={(e) => setNewOption({ ...newOption, additionalPrice: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="optionStock" className="text-xs">재고</Label>
                        <Input
                          id="optionStock"
                          type="number"
                          value={newOption.stock}
                          onChange={(e) => setNewOption({ ...newOption, stock: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">판매가능</Label>
                        <div className="flex items-center h-8">
                          <input
                            type="checkbox"
                            checked={newOption.isAvailable}
                            onChange={(e) => setNewOption({ ...newOption, isAvailable: e.target.checked })}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddOption}
                      className="w-full h-8"
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      옵션 추가
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Images & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>이미지 & 배송</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>상품 메인 이미지 (썸네일/캐러셀)</Label>
                <p className="text-xs text-gray-500 mt-1">첫 번째 이미지가 대표 이미지로 사용됩니다</p>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">클릭하여 메인 이미지 업로드</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt="" className="w-full h-24 object-cover rounded" />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                            대표
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail Page Images - Right after Main Images */}
              <div className="pt-4 border-t">
                <Label className="text-base font-semibold">상세페이지 이미지 (선택사항)</Label>
                <p className="text-xs text-gray-500 mt-1">상품 상세페이지에 표시될 이미지들</p>
                <div className="mt-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">상세 이미지 업로드</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleDetailImageUpload(e.target.files)}
                      disabled={uploadingDetail}
                    />
                  </label>
                </div>
                {detailImages.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-gray-600">업로드된 이미지 {detailImages.length}개</p>
                    {detailImages.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded group">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 truncate">{url.split('/').pop()}</p>
                          <p className="text-xs text-gray-400">순서: {index + 1}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDetailImage(index)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingFee">배송비 (원) *</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    value={formData.shippingFee}
                    onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="courierCompany">택배사</Label>
                  <Input
                    id="courierCompany"
                    value={formData.courierCompany}
                    onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canCombineShipping"
                  checked={formData.canCombineShipping}
                  onChange={(e) => setFormData({ ...formData, canCombineShipping: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="canCombineShipping">합포장 가능</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderQuantity">최소 주문수량</Label>
                  <Input
                    id="minOrderQuantity"
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxOrderQuantity">최대 주문수량</Label>
                  <Input
                    id="maxOrderQuantity"
                    type="number"
                    value={formData.maxOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "수정 중..." : "수정 완료"}
          </Button>
        </div>
      </form>
    </div>
  )
}
