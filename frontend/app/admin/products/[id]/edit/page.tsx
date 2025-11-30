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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductNoticeForm, ProductNoticeData } from "@/components/admin/ProductNoticeForm"
import { COURIER_COMPANIES, getCourierCodeByName } from "@/lib/courier-companies"

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
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("")
  const [childCategories, setChildCategories] = useState<Category[]>([])
  const [eventCategories, setEventCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    origin: "",
    summary: "",
    detailDescription: "",
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
    courierCode: "",
    minOrderQuantity: "1",
    maxOrderQuantity: "",
    isEventProduct: false,
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)

  // Product notice state
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
    fetchCategories()
    fetchProduct()
    fetchOptions()
    fetchProductNotice()
  }, [productId])

  // Update child categories when parent category changes
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

  // Initialize parent category when both categories and formData are loaded
  useEffect(() => {
    if (formData.category && categories.length > 0 && !selectedParentCategory) {
      // Check if category is a child category
      for (const parentCat of categories) {
        if (parentCat.children) {
          const childCat = parentCat.children.find(c => c.code === formData.category)
          if (childCat) {
            setSelectedParentCategory(parentCat.code)
            return
          }
        }
        // Check if category is a parent category
        if (parentCat.code === formData.category) {
          setSelectedParentCategory(formData.category)
          return
        }
      }
    }
  }, [formData.category, categories, selectedParentCategory])

  const fetchActiveSellers = async () => {
    try {
      const data = await apiFetch<Seller[]>("/api/admin/sellers/active", { auth: true })
      setActiveSellers(data)
    } catch (error) {
      console.error("Error fetching sellers:", error)
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

  const fetchProduct = async () => {
    try {
      const product = await apiFetch<any>(`/api/products/${productId}`)
      // courierCode 결정: courierCode가 있으면 사용, 없으면 courierCompany 이름으로 코드 조회
      const courierCode = product.courierCode || getCourierCodeByName(product.courierCompany) || ""
      setFormData({
        name: product.name || "",
        category: product.category || "",
        origin: product.origin || "",
        summary: product.summary || "",
        detailDescription: product.detailDescription || "",
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
        courierCode: courierCode,
        minOrderQuantity: product.minOrderQuantity?.toString() || "1",
        maxOrderQuantity: product.maxOrderQuantity?.toString() || "",
        isEventProduct: product.isEventProduct || false,
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

  const fetchProductNotice = async () => {
    try {
      const noticeData = await apiFetch<ProductNoticeData>(`/api/products/${productId}/notice`, { auth: true })
      setProductNotice(noticeData)
    } catch (error) {
      // 고시 정보가 없으면 빈 객체 유지
      console.log("No product notice found")
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
      summary: formData.summary,
      detailDescription: formData.detailDescription,
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
      courierCode: formData.courierCode || null,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
      isEventProduct: formData.isEventProduct,
    }

    try {
      await apiFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(productData),
        parseResponse: "none",
      })

      // 상품 고시 정보 저장
      if (Object.values(productNotice).some(v => v)) {
        try {
          await apiFetch(`/api/products/${productId}/notice`, {
            method: "POST",
            auth: true,
            body: JSON.stringify(productNotice),
          })
        } catch (error) {
          console.error("Error saving product notice:", error)
        }
      }

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
                  <Label htmlFor="parentCategory">대카테고리 *</Label>
                  <Select
                    value={selectedParentCategory}
                    onValueChange={(value) => {
                      setSelectedParentCategory(value)
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
                />
              </div>

              <div>
                <Label htmlFor="summary">상품 요약</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  placeholder="상품의 간단한 요약을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="detailDescription">상품 설명 (마크다운 형식)</Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  아래 이미지를 클릭하거나 드래그해서 마크다운에 삽입할 수 있습니다.
                </p>
                <Textarea
                  id="detailDescription"
                  value={formData.detailDescription}
                  onChange={(e) => setFormData({ ...formData, detailDescription: e.target.value })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const url = e.dataTransfer.getData('text/plain')
                    if (url) {
                      const fileName = url.split('/').pop() || 'media'
                      const markdown = `![${fileName}](${url})\n\n`
                      // 기존 내용 끝에 추가 (앞에 줄바꿈이 없으면 추가)
                      const currentValue = formData.detailDescription
                      const needsNewline = currentValue && !currentValue.endsWith('\n')
                      const newValue = currentValue + (needsNewline ? '\n\n' : '') + markdown
                      setFormData({ ...formData, detailDescription: newValue })
                    }
                  }}
                  rows={10}
                  placeholder="# 상품 설명&#10;&#10;## 주요 특징&#10;- 특징 1&#10;- 특징 2&#10;&#10;마크다운 형식으로 상세한 설명을 작성하세요"
                  className="font-mono text-sm"
                />

                {/* 상세 이미지 갤러리 - 마크다운 에디터 바로 아래로 이동 */}
                {detailImages.length > 0 && (
                  <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                    <Label className="text-sm font-medium mb-2 block">이미지 갤러리 (클릭하여 삽입)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {detailImages.map((url, index) => {
                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i)
                        const fileName = url.split('/').pop() || 'media'
                        return (
                          <div
                            key={index}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', url)
                              e.dataTransfer.effectAllowed = 'copy'
                            }}
                            onClick={() => {
                              // 클릭 시 마크다운에 삽입
                              const markdown = `![${fileName}](${url})\n\n`
                              const currentValue = formData.detailDescription
                              const needsNewline = currentValue && !currentValue.endsWith('\n')
                              const newValue = currentValue + (needsNewline ? '\n\n' : '') + markdown
                              setFormData({ ...formData, detailDescription: newValue })
                            }}
                            className="relative group cursor-pointer hover:opacity-80 transition-opacity"
                            title="클릭하여 마크다운에 삽입"
                          >
                            {isVideo ? (
                              <video src={url} className="w-full h-20 object-cover rounded" />
                            ) : (
                              <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded flex items-center justify-center transition-all">
                              <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeDetailImage(index)
                              }}
                              className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-bl"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
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

              {/* Detail Page Images Upload Only */}
              <div className="pt-4 border-t">
                <Label className="text-base font-semibold">상세페이지 이미지/동영상 업로드</Label>
                <p className="text-xs text-gray-500 mt-1">이미지나 동영상을 업로드하면 마크다운 에디터 아래 갤러리에 나타납니다</p>
                <div className="mt-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">이미지 또는 동영상 업로드</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {uploadingDetail ? '업로드 중...' : `이미지: JPG, PNG, GIF / 동영상: MP4, WebM ${detailImages.length > 0 ? `(${detailImages.length}개 업로드됨)` : ''}`}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,video/mp4,video/webm,video/ogg"
                      onChange={(e) => handleDetailImageUpload(e.target.files)}
                      disabled={uploadingDetail}
                    />
                  </label>
                </div>
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
                  <Select
                    value={formData.courierCode || ""}
                    onValueChange={(value) => {
                      const courier = COURIER_COMPANIES.find(c => c.code === value)
                      setFormData({
                        ...formData,
                        courierCode: value,
                        courierCompany: courier?.name || ""
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="택배사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURIER_COMPANIES.map((courier) => (
                        <SelectItem key={courier.code} value={courier.code}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {formData.canCombineShipping && (
                <div>
                  <Label htmlFor="combineShippingUnit">합포장 개수 (개)</Label>
                  <Input
                    id="combineShippingUnit"
                    type="number"
                    value={formData.combineShippingUnit}
                    onChange={(e) => setFormData({ ...formData, combineShippingUnit: e.target.value })}
                    min="1"
                    placeholder="예: 5 (5개까지 합포장)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    몇 개까지 한 박스에 합포장이 가능한지 입력하세요
                  </p>
                </div>
              )}

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
            {loading ? "수정 중..." : "수정 완료"}
          </Button>
        </div>
      </form>
    </div>
  )
}
