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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Package,
  CheckCircle,
  XCircle,
  TrendingDown,
  DollarSign,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { toast as sonnerToast } from "sonner"

interface Seller {
  id: number
  name: string
  businessNumber: string
  representative: string
  spreadsheetId?: string
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

interface ProductStatistics {
  totalProducts: number
  inStockProducts: number
  soldOutProducts: number
  discountedProducts: number
  totalStockValue: number
}

interface ProductPage {
  content: Product[]
  totalElements: number
  totalPages: number
  number: number
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSellers, setActiveSellers] = useState<Seller[]>([])

  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [sellerFilter, setSellerFilter] = useState<string>("ALL")
  const [stockFilter, setStockFilter] = useState<string>("ALL")
  const [keyword, setKeyword] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // Google Sheets sync state
  const [syncing, setSyncing] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState<string>("ALL")

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
    fetchStatistics()
  }, [page, categoryFilter, sellerFilter, stockFilter, keyword])

  const fetchStatistics = async () => {
    try {
      const data = await apiFetch<{ content: Product[] }>("/api/products?size=1000")
      const allProducts = data.content || []

      const stats: ProductStatistics = {
        totalProducts: allProducts.length,
        inStockProducts: allProducts.filter(p => p.stock > 0).length,
        soldOutProducts: allProducts.filter(p => p.stock === 0).length,
        discountedProducts: allProducts.filter(p => p.discountRate && p.discountRate > 0).length,
        totalStockValue: allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
      }

      setStatistics(stats)
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        sort: "createdAt,desc",
      })

      // Apply filters (client-side for now)
      const data = await apiFetch<ProductPage>(`/api/products?${params.toString()}`)

      let filteredProducts = data.content || []

      // Filter by category
      if (categoryFilter !== "ALL") {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter)
      }

      // Filter by seller
      if (sellerFilter !== "ALL") {
        if (sellerFilter === "DIRECT") {
          filteredProducts = filteredProducts.filter(p => !p.seller)
        } else {
          filteredProducts = filteredProducts.filter(p => p.seller?.id === parseInt(sellerFilter))
        }
      }

      // Filter by stock status
      if (stockFilter === "IN_STOCK") {
        filteredProducts = filteredProducts.filter(p => p.stock > 0)
      } else if (stockFilter === "SOLD_OUT") {
        filteredProducts = filteredProducts.filter(p => p.stock === 0)
      }

      // Filter by keyword
      if (keyword) {
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(keyword.toLowerCase())
        )
      }

      setProducts(filteredProducts)
      setTotalElements(filteredProducts.length)
      setTotalPages(Math.ceil(filteredProducts.length / 20))
    } catch (error) {
      console.error("Error fetching products:", error)
      sonnerToast.error("상품 목록을 불러오는 중 오류가 발생했습니다")
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
    }
  }

  const handleSyncProductsToGoogleSheets = async () => {
    if (selectedSellerId === "ALL") {
      sonnerToast.error("상품을 동기화할 판매자를 선택해주세요")
      return
    }

    setSyncing(true)
    try {
      await apiFetch(`/api/admin/sheets/products/sync/${selectedSellerId}`, {
        method: "POST",
        auth: true,
        parseResponse: "json",
      })

      sonnerToast.success("구글 스프레드시트에 상품 목록이 동기화되었습니다")
    } catch (error) {
      console.error("Error syncing to Google Sheets:", error)
      sonnerToast.error("구글 스프레드시트 동기화 중 오류가 발생했습니다")
    } finally {
      setSyncing(false)
    }
  }

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(0)
  }

  const handleRefresh = () => {
    fetchProducts()
    fetchStatistics()
    sonnerToast.success("새로고침 완료")
  }

  const handleEdit = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await apiFetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })

      sonnerToast.success("상품이 삭제되었습니다")
      fetchProducts()
      fetchStatistics()
    } catch (error: any) {
      console.error("Error deleting product:", error)

      if (error?.payload?.errorCode === "PRODUCT_HAS_ORDER_HISTORY") {
        const shouldSetStockZero = confirm(
          "주문 이력이 있는 상품은 삭제할 수 없습니다.\n\n대신 재고를 0으로 설정하여 판매를 중단하시겠습니까?"
        )

        if (shouldSetStockZero) {
          sonnerToast("상품 수정 페이지에서 재고를 0으로 설정해주세요")
        }
      } else {
        sonnerToast.error(getErrorMessage(error, "상품 삭제 중 오류가 발생했습니다"))
      }
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

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">상품 관리</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 상품</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                총 재고 가치: {statistics.totalStockValue.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">판매 중</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{statistics.inStockProducts}</div>
              <p className="text-xs text-muted-foreground">
                재고가 있는 상품
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">품절</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{statistics.soldOutProducts}</div>
              <p className="text-xs text-muted-foreground">
                재고 0개 상품
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">할인 중</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{statistics.discountedProducts}</div>
              <p className="text-xs text-muted-foreground">
                할인율이 적용된 상품
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sellerFilter} onValueChange={(value) => { setSellerFilter(value); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="판매자" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 판매자</SelectItem>
                <SelectItem value="DIRECT">직매</SelectItem>
                {activeSellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id.toString()}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(value) => { setStockFilter(value); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="재고 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="IN_STOCK">판매중</SelectItem>
                <SelectItem value="SOLD_OUT">품절</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="상품명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="판매자 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">판매자 선택</SelectItem>
              {activeSellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id.toString()}>
                  {seller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSyncProductsToGoogleSheets}
            disabled={syncing || selectedSellerId === "ALL"}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "동기화 중..." : "구글 시트 동기화"}
          </Button>
        </div>

        <Link href="/admin/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            상품 등록
          </Button>
        </Link>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>상품 목록 ({totalElements}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              상품이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>원산지</TableHead>
                    <TableHead>판매자</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>할인</TableHead>
                    <TableHead>재고</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.origin}</TableCell>
                      <TableCell>
                        {product.seller ? (
                          <div className="text-sm">
                            <div className="font-medium">{product.seller.name}</div>
                            <div className="text-gray-500 text-xs">{product.seller.businessNumber}</div>
                          </div>
                        ) : (
                          <Badge variant="outline">직매</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.discountRate ? (
                          <div className="flex flex-col">
                            <span className="line-through text-xs text-gray-400">
                              {product.price.toLocaleString()}원
                            </span>
                            <span className="font-semibold">
                              {Math.round(product.price * (1 - product.discountRate / 100)).toLocaleString()}원
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold">{product.price.toLocaleString()}원</span>
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
                        <Badge
                          variant={product.stock > 0 ? "default" : "destructive"}
                          className={product.stock > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {product.stock > 0 ? `${product.stock}개` : "품절"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(product.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    이전
                  </Button>
                  <span className="flex items-center px-4">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
