'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, getErrorMessage } from '@/lib/api-client'
import { Zap, Plus, Edit, Trash2, Calendar } from 'lucide-react'

interface Product {
  id: number
  name: string
  category: string
  price: number
  discountedPrice: number
  imageUrl: string
}

interface SpecialDeal {
  id: number
  title: string
  description: string
  startTime: string
  endTime: string
  discountRate: number
  isActive: boolean
  displayOrder: number
  bannerImageUrl: string
  backgroundColor: string
  textColor: string
  products: Product[]
}

export default function AdminSpecialDealsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [deals, setDeals] = useState<SpecialDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<SpecialDeal | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    discountRate: 0,
    isActive: true,
    displayOrder: 0,
    bannerImageUrl: '',
    backgroundColor: '#FFF5E6',
    textColor: '#000000',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast({
        title: '접근 권한 없음',
        description: '관리자 로그인이 필요합니다.',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    fetchDeals()
    fetchProducts()
  }, [])

  const fetchDeals = async () => {
    try {
      const data = await apiFetch<SpecialDeal[]>('/api/admin/special-deals', {
        auth: true,
      })
      setDeals(data)
    } catch (error) {
      console.error('Error fetching special deals:', error)
      toast({
        title: '오류',
        description: getErrorMessage(error, '특가 목록을 불러오는 중 오류가 발생했습니다.'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await apiFetch<{ content: Product[] }>('/api/products?size=1000', {
        auth: true,
      })
      setAllProducts(data.content || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: '오류',
        description: getErrorMessage(error, '상품 목록을 불러오는 중 오류가 발생했습니다.'),
        variant: 'destructive',
      })
    }
  }

  const handleCreate = () => {
    setEditingDeal(null)
    setSelectedProductIds([])
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      discountRate: 0,
      isActive: true,
      displayOrder: 0,
      bannerImageUrl: '',
      backgroundColor: '#FFF5E6',
      textColor: '#000000',
    })
    setDialogOpen(true)
  }

  const handleEdit = (deal: SpecialDeal) => {
    setEditingDeal(deal)
    setSelectedProductIds(deal.products?.map(p => p.id) || [])
    setFormData({
      title: deal.title,
      description: deal.description,
      startTime: new Date(deal.startTime).toISOString().slice(0, 16),
      endTime: new Date(deal.endTime).toISOString().slice(0, 16),
      discountRate: deal.discountRate,
      isActive: deal.isActive,
      displayOrder: deal.displayOrder,
      bannerImageUrl: deal.bannerImageUrl || '',
      backgroundColor: deal.backgroundColor || '#FFF5E6',
      textColor: deal.textColor || '#000000',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        productIds: selectedProductIds,
      }

      if (editingDeal) {
        await apiFetch(`/api/admin/special-deals/${editingDeal.id}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify(payload),
        })
        toast({
          title: '특가 수정 완료',
          description: '특가가 성공적으로 수정되었습니다.',
        })
      } else {
        await apiFetch('/api/admin/special-deals', {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        })
        toast({
          title: '특가 생성 완료',
          description: '새로운 특가가 생성되었습니다.',
        })
      }

      setDialogOpen(false)
      fetchDeals()
    } catch (error) {
      console.error('Error saving special deal:', error)
      toast({
        title: '오류',
        description: getErrorMessage(error, '특가 저장 중 오류가 발생했습니다.'),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 특가를 삭제하시겠습니까?')) return

    try {
      await apiFetch(`/api/admin/special-deals/${id}`, {
        method: 'DELETE',
        auth: true,
        parseResponse: 'none',
      })
      toast({
        title: '특가 삭제 완료',
        description: '특가가 성공적으로 삭제되었습니다.',
      })
      fetchDeals()
    } catch (error) {
      console.error('Error deleting special deal:', error)
      toast({
        title: '오류',
        description: getErrorMessage(error, '특가 삭제 중 오류가 발생했습니다.'),
        variant: 'destructive',
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            특가 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">특가 이벤트를 생성하고 관리하세요</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          특가 생성
        </Button>
      </div>

      {/* Deals Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            특가 목록 ({deals.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              특가가 없습니다. 새로운 특가를 생성해보세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>할인율</TableHead>
                  <TableHead>상품 수</TableHead>
                  <TableHead>시작일시</TableHead>
                  <TableHead>종료일시</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>순서</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.id}</TableCell>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-600 text-white">
                        {deal.discountRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {deal.products?.length || 0}개
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(deal.startTime)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(deal.endTime)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={deal.isActive ? 'default' : 'secondary'}>
                        {deal.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>{deal.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(deal)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(deal.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDeal ? '특가 수정' : '새 특가 생성'}
            </DialogTitle>
            <DialogDescription>
              특가 이벤트 정보를 입력하고 특가에 포함할 상품을 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="예: 이번주 특가 세일"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="특가 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">시작일시 *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">종료일시 *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountRate">할인율 (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountRate: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bannerImageUrl">배너 이미지 URL</Label>
              <Input
                id="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, bannerImageUrl: e.target.value })
                }
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="backgroundColor">배경색</Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) =>
                    setFormData({ ...formData, backgroundColor: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="textColor">텍스트 색</Label>
                <Input
                  id="textColor"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) =>
                    setFormData({ ...formData, textColor: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                활성화
              </Label>
            </div>

            {/* 상품 선택 */}
            <div className="grid gap-2 border-t pt-4">
              <Label>특가 상품 선택 ({selectedProductIds.length}개 선택됨)</Label>
              <div className="border rounded-md max-h-60 overflow-y-auto p-3 bg-gray-50">
                {allProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    상품이 없습니다.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {allProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedProductIds((prev) =>
                            prev.includes(product.id)
                              ? prev.filter((id) => id !== product.id)
                              : [...prev, product.id]
                          )
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <img
                          src={product.imageUrl || '/placeholder.svg'}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.category} · {product.discountedPrice.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {editingDeal ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
