"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { apiFetch, API_BASE_URL, getErrorMessage } from "@/lib/api-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductNoticeForm, ProductNoticeData } from "@/components/admin/ProductNoticeForm"

interface Seller {
  id: number
  name: string
}

interface Category {
  id: number
  code: string
  name: string
  iconName: string
  children: Category[]
  isVisible: boolean
  isEvent: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeSellers, setActiveSellers] = useState<Seller[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("")
  const [childCategories, setChildCategories] = useState<Category[]>([])
  const [eventCategories, setEventCategories] = useState<Category[]>([])
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
    isEventProduct: false,
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)

  // Options state
  const [options, setOptions] = useState<Array<{
    optionName: string
    optionValue: string
    additionalPrice: string
    stock: string
    isAvailable: boolean
  }>>([])
  const [newOption, setNewOption] = useState({
    optionName: "",
    optionValue: "",
    additionalPrice: "0",
    stock: "0",
    isAvailable: true,
  })

  // Product Notice state
  const [productNotice, setProductNotice] = useState<ProductNoticeData>({
    productName: "",
    foodType: "",
    manufacturer: "",
    expirationInfo: "",
    capacity: "",
    ingredients: "",
    nutritionFacts: "",
    gmoInfo: "",
    safetyWarnings: "",
    importDeclaration: "",
    customerServicePhone: "",
  })

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
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedParentCategory) {
      const parentCat = categories.find(cat => cat.code === selectedParentCategory)
      if (parentCat && parentCat.children) {
        setChildCategories(parentCat.children)
      } else {
        setChildCategories([])
      }
    } else {
      setChildCategories([])
    }
  }, [selectedParentCategory, categories])

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

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>("/api/admin/categories", {
        auth: true,
      })
      setCategories(data)

      // 이벤트 카테고리 필터링 (isEvent가 true인 모든 카테고리)
      const events: Category[] = []
      data.forEach(category => {
        if (category.isEvent) {
          events.push(category)
        }
        // 자식 카테고리 중 이벤트 카테고리도 포함
        if (category.children) {
          category.children.forEach(child => {
            if (child.isEvent) {
              events.push(child)
            }
          })
        }
      })
      setEventCategories(events)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "카테고리 목록을 불러오는 중 오류가 발생했습니다."),
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
        description: `${files.length}개의 메인 이미지가 업로드되었습니다.`,
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

  const handleDetailImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const token = localStorage.getItem("token")
    if (!token) return

    setUploadingDetail(true)
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
      setDetailImages((prev) => [...prev, ...fileUrls])
      toast({
        title: "업로드 완료",
        description: `${files.length}개의 상세 이미지가 업로드되었습니다.`,
      })
    } catch (error) {
      console.error("Error uploading detail images:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "이미지 업로드 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setUploadingDetail(false)
    }
  }

  const handleAddOption = () => {
    if (!newOption.optionName || !newOption.optionValue) {
      toast({
        title: "입력 오류",
        description: "옵션명과 옵션값을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setOptions([...options, { ...newOption }])
    setNewOption({
      optionName: "",
      optionValue: "",
      additionalPrice: "0",
      stock: "0",
      isAvailable: true,
    })

    toast({
      title: "옵션 추가됨",
      description: "상품 등록 시 함께 저장됩니다.",
    })
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
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
      detailImageUrls: detailImages.length > 0 ? detailImages.join(',') : null,
      sellerId: formData.sellerId ? parseInt(formData.sellerId) : null,
      supplyPrice: formData.supplyPrice ? parseFloat(formData.supplyPrice) : null,
      shippingFee: parseFloat(formData.shippingFee),
      canCombineShipping: formData.canCombineShipping,
      combineShippingUnit: formData.combineShippingUnit ? parseInt(formData.combineShippingUnit) : null,
      courierCompany: formData.courierCompany || null,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
      isEventProduct: formData.isEventProduct,
    }

    try {
      const createdProduct = await apiFetch<{ id: number }>("/api/admin/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify(productData),
        parseResponse: "json",
      })

      // 옵션 등록
      if (options.length > 0 && createdProduct.id) {
        for (const option of options) {
          try {
            await apiFetch(`/api/admin/products/${createdProduct.id}/options`, {
              method: "POST",
              auth: true,
              body: JSON.stringify({
                optionName: option.optionName,
                optionValue: option.optionValue,
                additionalPrice: parseFloat(option.additionalPrice),
                stock: parseInt(option.stock),
                isAvailable: option.isAvailable,
              }),
              parseResponse: "none",
            })
          } catch (error) {
            console.error("Error saving option:", error)
          }
        }
      }

      // 상품 고시 정보 등록
      if (Object.values(productNotice).some(v => v)) {
        try {
          await apiFetch(`/api/products/${createdProduct.id}/notice`, {
            method: "POST",
            auth: true,
            body: JSON.stringify(productNotice),
          })
        } catch (error) {
          console.error("Error saving product notice:", error)
        }
      }

      toast({
        title: "등록 완료",
        description: `상품이 성공적으로 등록되었습니다${options.length > 0 ? ` (옵션 ${options.length}개 포함)` : ""}.`,
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

  const removeDetailImage = (index: number) => {
    setDetailImages(detailImages.filter((_, i) => i !== index))
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
          <h1 className="text-2xl font-semibold text-gray-900">새 상품 등록</h1>
          <p className="text-sm text-gray-500 mt-1">판매할 상품 정보를 입력하세요</p>
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
                  placeholder="상품명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentCategory">대카테고리 *</Label>
                  <Select
                    value={selectedParentCategory}
                    onValueChange={(value) => {
                      setSelectedParentCategory(value)
                      // 대카테고리 선택 시 일단 대카테고리로 설정 (소카테고리가 없으면 이것이 최종값)
                      setFormData({ ...formData, category: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="대카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.code} value={category.code}>
                          {category.iconName} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="childCategory">소카테고리</Label>
                  <Select
                    value={
                      // formData.category가 childCategories에 있으면 그 값, 아니면 빈 문자열
                      childCategories.some(c => c.code === formData.category) ? formData.category : ""
                    }
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={!selectedParentCategory || childCategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={childCategories.length === 0 ? "하위 카테고리 없음" : "소카테고리 선택"} />
                    </SelectTrigger>
                    <SelectContent>
                      {childCategories.map((category) => (
                        <SelectItem key={category.code} value={category.code}>
                          {category.iconName} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    선택하지 않으면 대카테고리로 등록됩니다
                  </p>
                </div>
              </div>

              {/* 이벤트 상품 체크박스 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isEventProduct"
                  checked={formData.isEventProduct}
                  onChange={(e) => setFormData({ ...formData, isEventProduct: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isEventProduct" className="cursor-pointer">
                  이벤트 상품으로 등록
                  {eventCategories.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({eventCategories.map(c => c.name).join(", ")}에 표시)
                    </span>
                  )}
                </Label>
              </div>

              <div>
                <Label htmlFor="origin">원산지 *</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  required
                  placeholder="예: 국내산"
                />
              </div>

              <div>
                <Label htmlFor="description">상품 설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="상품에 대한 자세한 설명을 입력하세요"
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
                    placeholder="10000"
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
                    placeholder="10"
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
                    placeholder="100"
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
                <Label className="text-base font-semibold">상품 옵션 (선택사항)</Label>
                <div className="mt-3 space-y-3">
                  {/* Option List */}
                  {options.length > 0 && (
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1">
                            <span className="font-medium">{option.optionName}:</span> {option.optionValue}
                            <span className="text-gray-500 ml-2">+{option.additionalPrice}원</span>
                            <span className="text-gray-500 ml-2">재고 {option.stock}개</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <X className="h-3 w-3" />
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
                          placeholder="0"
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
                          placeholder="0"
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
                    placeholder="3000"
                  />
                </div>
                <div>
                  <Label htmlFor="courierCompany">택배사</Label>
                  <Input
                    id="courierCompany"
                    value={formData.courierCompany}
                    onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                    placeholder="CJ대한통운"
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
                    placeholder="1"
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
                    placeholder="99"
                  />
                </div>
              </div>

              <div>
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
            </CardContent>
          </Card>
        </div>

        {/* Product Notice Form */}
        <div className="mt-6">
          <ProductNoticeForm
            data={productNotice}
            onChange={setProductNotice}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
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
    </div>
  )
}
