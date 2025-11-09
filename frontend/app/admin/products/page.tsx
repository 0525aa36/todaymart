"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { apiFetch, API_BASE_URL, getErrorMessage } from "@/lib/api-client"

interface Seller {
  id: number
  name: string
  businessNumber: string
  representative: string
}

interface Product {
  id: number
  name: string
  category: string
  origin: string
  description: string
  price: number
  discountRate?: number
  stock: number
  imageUrl: string
  imageUrls?: string
  seller?: Seller
  createdAt: string
  updatedAt: string
}

interface ProductOption {
  id: number
  optionName: string
  optionValue: string
  additionalPrice: number
  stock: number
  isAvailable: boolean
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeSellers, setActiveSellers] = useState<Seller[]>([])

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
    // 새로 추가된 필드
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

  // Options state
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)
  const [optionFormOpen, setOptionFormOpen] = useState(false)
  const [optionFormData, setOptionFormData] = useState({
    optionName: "",
    optionValue: "",
    additionalPrice: "",
    stock: "",
    isAvailable: true,
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

    fetchProducts()
    fetchActiveSellers()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await apiFetch<{ content?: Product[] }>("/api/products?size=100&sort=createdAt,desc")
      setProducts(data.content || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

      // URL이 이미 절대 URL인 경우 그대로 사용, 아니면 API_BASE_URL 추가
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

      // URL이 이미 절대 URL인 경우 그대로 사용, 아니면 API_BASE_URL 추가
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
      // 새로 추가된 필드
      supplyPrice: formData.supplyPrice ? parseFloat(formData.supplyPrice) : null,
      shippingFee: parseFloat(formData.shippingFee),
      canCombineShipping: formData.canCombineShipping,
      combineShippingUnit: formData.combineShippingUnit ? parseInt(formData.combineShippingUnit) : null,
      courierCompany: formData.courierCompany || null,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
    }

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"

      await apiFetch(url, {
        method: editingProduct ? "PUT" : "POST",
        auth: true,
        body: JSON.stringify(productData),
        parseResponse: "none",
      })

      toast({
        title: editingProduct ? "수정 완료" : "등록 완료",
        description: `상품이 성공적으로 ${editingProduct ? "수정" : "등록"}되었습니다.`,
      })
      setDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "상품 저장 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      origin: product.origin,
      description: product.description,
      price: product.price.toString(),
      discountRate: product.discountRate?.toString() || "",
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || "",
      sellerId: product.seller?.id.toString() || "",
      // 새로 추가된 필드 (백엔드에서 안 오면 기본값)
      supplyPrice: product.supplyPrice?.toString() || "",
      shippingFee: product.shippingFee?.toString() || "3000",
      canCombineShipping: product.canCombineShipping || false,
      combineShippingUnit: product.combineShippingUnit?.toString() || "",
      courierCompany: product.courierCompany || "",
      minOrderQuantity: product.minOrderQuantity?.toString() || "1",
      maxOrderQuantity: product.maxOrderQuantity?.toString() || "",
    })

    // 기존 이미지 URL들을 uploadedImages에 설정
    if (product.imageUrls) {
      setUploadedImages(product.imageUrls.split(','))
    } else if (product.imageUrl) {
      setUploadedImages([product.imageUrl])
    }

    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "삭제 완료",
        description: "상품이 삭제되었습니다.",
      })
      fetchProducts()
    } catch (error: any) {
      console.error("Error deleting product:", error)

      // 주문 이력이 있는 상품인 경우 특별한 안내
      if (error?.payload?.errorCode === "PRODUCT_HAS_ORDER_HISTORY") {
        const shouldSetStockZero = confirm(
          "주문 이력이 있는 상품은 삭제할 수 없습니다.\n\n대신 재고를 0으로 설정하여 판매를 중단하시겠습니까?"
        )

        if (shouldSetStockZero) {
          // 재고를 0으로 설정하는 로직은 별도로 구현 필요
          toast({
            title: "안내",
            description: "상품 수정 페이지에서 재고를 0으로 설정해주세요.",
          })
        }
      } else {
        toast({
          title: "삭제 실패",
          description: getErrorMessage(error, "상품 삭제 중 오류가 발생했습니다."),
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      category: "",
      origin: "",
      description: "",
      price: "",
      discountRate: "",
      stock: "",
      imageUrl: "",
      sellerId: "",
      // 새로 추가된 필드
      supplyPrice: "",
      shippingFee: "3000",
      canCombineShipping: false,
      combineShippingUnit: "",
      courierCompany: "",
      minOrderQuantity: "1",
      maxOrderQuantity: "",
    })
    setUploadedImages([])
    setDescriptionImages([])
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // ========== Option Management Functions ==========

  const handleManageOptions = async (product: Product) => {
    setSelectedProduct(product)
    setOptionsDialogOpen(true)
    await fetchProductOptions(product.id)
  }

  const fetchProductOptions = async (productId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<ProductOption[]>(`/api/admin/products/${productId}/options`, {
        auth: true,
      })
      setProductOptions(data)
    } catch (error) {
      console.error("Error fetching options:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "옵션 목록을 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleAddOption = () => {
    setEditingOption(null)
    setOptionFormData({
      optionName: "",
      optionValue: "",
      additionalPrice: "",
      stock: "",
      isAvailable: true,
    })
    setOptionFormOpen(true)
  }

  const handleEditOption = (option: ProductOption) => {
    setEditingOption(option)
    setOptionFormData({
      optionName: option.optionName,
      optionValue: option.optionValue,
      additionalPrice: option.additionalPrice.toString(),
      stock: option.stock.toString(),
      isAvailable: option.isAvailable,
    })
    setOptionFormOpen(true)
  }

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    const token = localStorage.getItem("token")
    if (!token) return

    const optionData = {
      optionName: optionFormData.optionName,
      optionValue: optionFormData.optionValue,
      additionalPrice: parseFloat(optionFormData.additionalPrice) || 0,
      stock: parseInt(optionFormData.stock) || 0,
      isAvailable: optionFormData.isAvailable,
    }

    try {
      const url = editingOption
        ? `/api/admin/products/options/${editingOption.id}`
        : `/api/admin/products/${selectedProduct.id}/options`

      await apiFetch(url, {
        method: editingOption ? "PUT" : "POST",
        auth: true,
        body: JSON.stringify(optionData),
        parseResponse: "none",
      })

      toast({
        title: editingOption ? "수정 완료" : "추가 완료",
        description: `옵션이 성공적으로 ${editingOption ? "수정" : "추가"}되었습니다.`,
      })
      setOptionFormOpen(false)
      fetchProductOptions(selectedProduct.id)
    } catch (error) {
      console.error("Error saving option:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "옵션 저장 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    if (!selectedProduct) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch(`/api/admin/products/options/${optionId}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      toast({
        title: "삭제 완료",
        description: "옵션이 삭제되었습니다.",
      })
      fetchProductOptions(selectedProduct.id)
    } catch (error) {
      console.error("Error deleting option:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "옵션 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">상품 관리</h1>
            <p className="text-sm text-gray-500 mt-1">등록된 상품을 관리하고 새 상품을 추가하세요</p>
          </div>

          <Link href="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              상품 등록
            </Button>
          </Link>

          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogContent className="sm:max-w-[625px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "상품 수정" : "새 상품 등록"}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "상품 정보를 수정하세요" : "판매할 상품 정보를 입력하세요"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
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
                        rows={3}
                        placeholder="상품에 대한 상세 설명을 입력하세요"
                      />
                    </div>
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

                    {/* 배송 및 수량 정보 */}
                    <div className="border-t pt-4 mt-2">
                      <h3 className="font-semibold mb-3 text-sm text-gray-700">배송 정보</h3>
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
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="grid gap-2">
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
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="courierCompany">택배사</Label>
                        <Input
                          id="courierCompany"
                          value={formData.courierCompany}
                          onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                          placeholder="예: CJ대한통운, 로젠택배"
                        />
                      </div>
                    </div>

                    {/* 주문 수량 제한 */}
                    <div className="border-t pt-4 mt-2">
                      <h3 className="font-semibold mb-3 text-sm text-gray-700">주문 수량 설정</h3>
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

                    <div className="grid gap-2">
                      <Label htmlFor="productImages">상품 이미지 (여러 장 업로드 가능)</Label>
                      <Input
                        id="productImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                        disabled={uploading}
                      />
                      {uploadedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadedImages.map((url, index) => (
                            <div key={index} className="relative w-20 h-20">
                              <img src={url} alt={`상품 ${index + 1}`} className="w-full h-full object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">첫 번째 이미지가 대표 이미지로 사용됩니다.</p>
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
                      />
                      <p className="text-xs text-muted-foreground">이미지가 자동으로 설명에 추가됩니다.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      취소
                    </Button>
                    <Button type="submit">{editingProduct ? "수정" : "등록"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                등록된 상품 ({products.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">등록된 상품이 없습니다. 새 상품을 등록해보세요!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-gray-50/50">
                        <TableHead className="w-[60px] font-semibold text-gray-700">ID</TableHead>
                        <TableHead className="font-semibold text-gray-700">상품명</TableHead>
                        <TableHead className="font-semibold text-gray-700">카테고리</TableHead>
                        <TableHead className="font-semibold text-gray-700">원산지</TableHead>
                        <TableHead className="font-semibold text-gray-700">판매자</TableHead>
                        <TableHead className="font-semibold text-gray-700">가격</TableHead>
                        <TableHead className="font-semibold text-gray-700">할인</TableHead>
                        <TableHead className="font-semibold text-gray-700">재고</TableHead>
                        <TableHead className="font-semibold text-gray-700">등록일</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium text-gray-900">{product.id}</TableCell>
                          <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{product.origin}</TableCell>
                          <TableCell>
                            {product.seller ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{product.seller.name}</div>
                                <div className="text-gray-500 text-xs">{product.seller.businessNumber}</div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">직매</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.discountRate ? (
                              <div className="flex flex-col">
                                <span className="line-through text-xs text-gray-400">
                                  {product.price.toLocaleString()}원
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {Math.floor(product.price * (1 - product.discountRate / 100)).toLocaleString()}원
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-900">{product.price.toLocaleString()}원</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.discountRate ? (
                              <Badge variant="destructive">{product.discountRate}%</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.stock > 0 ? "default" : "destructive"} className={product.stock > 0 ? "bg-green-100 text-green-800" : ""}>
                              {product.stock > 0 ? `${product.stock}개` : "품절"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{formatDate(product.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageOptions(product)}
                                className="h-8 w-8 p-0"
                                title="옵션 관리"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0"
                                title="수정"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="h-8 w-8 p-0"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Options Management Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>상품 옵션 관리: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              이 상품의 옵션을 추가하거나 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">옵션 목록 ({productOptions.length}개)</h3>
              <Button onClick={handleAddOption} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                옵션 추가
              </Button>
            </div>
            {productOptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                등록된 옵션이 없습니다. 새 옵션을 추가해보세요!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>옵션명</TableHead>
                    <TableHead>옵션값</TableHead>
                    <TableHead>추가금액</TableHead>
                    <TableHead>재고</TableHead>
                    <TableHead>사용가능</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productOptions.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.optionName}</TableCell>
                      <TableCell>{option.optionValue}</TableCell>
                      <TableCell>
                        {option.additionalPrice === 0
                          ? "-"
                          : `${option.additionalPrice > 0 ? "+" : ""}${option.additionalPrice.toLocaleString()}원`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={option.stock > 0 ? "default" : "destructive"}>
                          {option.stock}개
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={option.isAvailable ? "default" : "secondary"}>
                          {option.isAvailable ? "가능" : "불가"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOption(option)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Option Form Dialog */}
      <Dialog open={optionFormOpen} onOpenChange={setOptionFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmitOption}>
            <DialogHeader>
              <DialogTitle>{editingOption ? "옵션 수정" : "옵션 추가"}</DialogTitle>
              <DialogDescription>
                {editingOption ? "옵션 정보를 수정하세요" : "새 옵션 정보를 입력하세요"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="optionName">옵션명 *</Label>
                <Input
                  id="optionName"
                  value={optionFormData.optionName}
                  onChange={(e) => setOptionFormData({ ...optionFormData, optionName: e.target.value })}
                  required
                  placeholder="예: 중량/용량, 색상"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="optionValue">옵션값 *</Label>
                <Input
                  id="optionValue"
                  value={optionFormData.optionValue}
                  onChange={(e) => setOptionFormData({ ...optionFormData, optionValue: e.target.value })}
                  required
                  placeholder="예: 1kg, 빨강"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="additionalPrice">추가금액 (원)</Label>
                  <Input
                    id="additionalPrice"
                    type="number"
                    value={optionFormData.additionalPrice}
                    onChange={(e) => setOptionFormData({ ...optionFormData, additionalPrice: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">기본 가격과의 차액</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="optionStock">재고 *</Label>
                  <Input
                    id="optionStock"
                    type="number"
                    value={optionFormData.stock}
                    onChange={(e) => setOptionFormData({ ...optionFormData, stock: e.target.value })}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={optionFormData.isAvailable}
                  onChange={(e) => setOptionFormData({ ...optionFormData, isAvailable: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isAvailable">판매 가능</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOptionFormOpen(false)}>
                취소
              </Button>
              <Button type="submit">{editingOption ? "수정" : "추가"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
