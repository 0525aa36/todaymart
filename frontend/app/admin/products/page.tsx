"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
  createdAt: string
  updatedAt: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

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

    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/products?size=100&sort=createdAt,desc")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.content || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "오류",
        description: "상품 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

      const response = await fetch("http://localhost:8081/api/files/upload-multiple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const fileUrls = data.fileUrls.map((url: string) => `http://localhost:8081${url}`)
        setUploadedImages((prev) => [...prev, ...fileUrls])
        toast({
          title: "업로드 완료",
          description: `${files.length}개의 이미지가 업로드되었습니다.`,
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "오류",
        description: "이미지 업로드 중 오류가 발생했습니다.",
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

      const response = await fetch("http://localhost:8081/api/files/upload-multiple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const fileUrls = data.fileUrls.map((url: string) => `http://localhost:8081${url}`)
        setDescriptionImages((prev) => [...prev, ...fileUrls])

        // 자동으로 description에 이미지 마크다운 추가
        const imageMarkdown = fileUrls.map((url: string) => `![이미지](${url})`).join('\n')
        setFormData((prev) => ({
          ...prev,
          description: prev.description + (prev.description ? '\n\n' : '') + imageMarkdown
        }))

        toast({
          title: "업로드 완료",
          description: `${files.length}개의 이미지가 설명에 추가되었습니다.`,
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "오류",
        description: "이미지 업로드 중 오류가 발생했습니다.",
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
    }

    try {
      const url = editingProduct
        ? `http://localhost:8081/api/admin/products/${editingProduct.id}`
        : "http://localhost:8081/api/admin/products"

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast({
          title: editingProduct ? "수정 완료" : "등록 완료",
          description: `상품이 성공적으로 ${editingProduct ? "수정" : "등록"}되었습니다.`,
        })
        setDialogOpen(false)
        resetForm()
        fetchProducts()
      } else {
        throw new Error("Failed to save product")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "오류",
        description: "상품 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
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
      const response = await fetch(`http://localhost:8081/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok || response.status === 204) {
        toast({
          title: "삭제 완료",
          description: "상품이 삭제되었습니다.",
        })
        fetchProducts()
      } else {
        throw new Error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "오류",
        description: "상품 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin">
                <Button variant="ghost" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  대시보드로 돌아가기
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">상품 관리</h1>
              <p className="text-muted-foreground">등록된 상품을 관리하고 새 상품을 추가하세요</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  상품 등록
                </Button>
              </DialogTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>등록된 상품 ({products.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 상품이 없습니다. 새 상품을 등록해보세요!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>상품명</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>원산지</TableHead>
                      <TableHead>가격</TableHead>
                      <TableHead>할인</TableHead>
                      <TableHead>재고</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.id}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.origin}</TableCell>
                        <TableCell>
                          {product.discountRate ? (
                            <div className="flex flex-col">
                              <span className="line-through text-xs text-muted-foreground">
                                {product.price.toLocaleString()}원
                              </span>
                              <span className="font-medium">
                                {Math.floor(product.price * (1 - product.discountRate / 100)).toLocaleString()}원
                              </span>
                            </div>
                          ) : (
                            <span>{product.price.toLocaleString()}원</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.discountRate ? (
                            <Badge variant="destructive">{product.discountRate}%</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                            {product.stock > 0 ? `${product.stock}개` : "품절"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(product.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
