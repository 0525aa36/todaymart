"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { AdminLoadingSpinner } from "@/components/admin/AdminLoadingSpinner"
import { LoadingButton } from "@/components/admin/LoadingButton"
import { SortableTableHead, SortDirection } from "@/components/ui/sortable-table-head"
import {
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Edit2,
  Check,
  X,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface InventoryStatistics {
  totalItems: number
  totalSoldOut: number
  totalLowStock: number
  totalInStock: number
  totalStockValue: number
}

interface InventoryItem {
  id: number
  type: "PRODUCT" | "OPTION"
  name: string
  category: string
  stock: number
  lowStockThreshold: number
  stockStatus: "SOLD_OUT" | "LOW_STOCK" | "IN_STOCK"
  price: number
  stockValue: number
  parentProductId?: number
  parentProductName?: string
  optionName?: string
}

interface InventoryPage {
  content: InventoryItem[]
  totalElements: number
  totalPages: number
  number: number
}

export default function InventoryPage() {
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [stockStatus, setStockStatus] = useState<string>("ALL")
  const [keyword, setKeyword] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // Sorting states
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingType, setEditingType] = useState<"PRODUCT" | "OPTION" | null>(null)
  const [editingField, setEditingField] = useState<"stock" | "threshold" | null>(null)
  const [editValue, setEditValue] = useState("")

  // Bulk update
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkStockChange, setBulkStockChange] = useState("")
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => {
    fetchStatistics()
    fetchItems()
  }, [page, stockStatus, keyword, sortKey, sortDirection])

  const fetchStatistics = async () => {
    try {
      const data = await apiFetch<InventoryStatistics>("/api/admin/inventory/statistics", { auth: true })
      setStatistics(data)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      toast.error("통계 데이터를 불러오는데 실패했습니다")
    }
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        sort: "id,asc",
      })

      if (stockStatus !== "ALL") {
        params.append("stockStatus", stockStatus)
      }

      if (keyword) {
        params.append("keyword", keyword)
      }

      const data = await apiFetch<InventoryPage>(
        `/api/admin/inventory/items?${params.toString()}`,
        { auth: true }
      )

      let sortedItems = [...data.content]

      // Apply client-side sorting
      if (sortKey && sortDirection) {
        sortedItems.sort((a, b) => {
          const direction = sortDirection === "asc" ? 1 : -1

          switch (sortKey) {
            case "id":
              return (a.id - b.id) * direction
            case "name":
              return a.name.localeCompare(b.name) * direction
            case "category":
              return a.category.localeCompare(b.category) * direction
            case "stock":
              return (a.stock - b.stock) * direction
            case "threshold":
              return (a.lowStockThreshold - b.lowStockThreshold) * direction
            case "price":
              return (a.price - b.price) * direction
            case "stockValue":
              return (a.stockValue - b.stockValue) * direction
            default:
              return 0
          }
        })
      }

      setItems(sortedItems)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (error) {
      console.error("Error fetching items:", error)
      toast.error("재고 목록을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(0)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const handleRefresh = () => {
    fetchStatistics()
    fetchItems()
    toast.success("새로고침 완료")
  }

  const startEdit = (item: InventoryItem, field: "stock" | "threshold") => {
    setEditingId(item.id)
    setEditingType(item.type)
    setEditingField(field)
    setEditValue(field === "stock" ? item.stock.toString() : item.lowStockThreshold.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingType(null)
    setEditingField(null)
    setEditValue("")
  }

  const saveEdit = async () => {
    if (!editingId || !editingType || !editingField) return

    try {
      const newValue = parseInt(editValue)
      if (isNaN(newValue) || newValue < 0) {
        toast.error("0 이상의 숫자를 입력해주세요")
        return
      }

      if (editingField === "stock") {
        const endpoint = editingType === "PRODUCT"
          ? `/api/admin/inventory/product/${editingId}/stock`
          : `/api/admin/inventory/option/${editingId}/stock`

        await apiFetch(endpoint, {
          method: "PUT",
          auth: true,
          body: JSON.stringify(null),
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(() => {
          // Use query parameter instead
          return apiFetch(`${endpoint}?stock=${newValue}`, {
            method: "PUT",
            auth: true,
          })
        })
      } else {
        await apiFetch(`/api/admin/inventory/product/${editingId}/threshold?threshold=${newValue}`, {
          method: "PUT",
          auth: true,
        })
      }

      toast.success("수정 완료")
      cancelEdit()
      fetchItems()
      fetchStatistics()
    } catch (error) {
      console.error("Error updating:", error)
      toast.error("수정에 실패했습니다")
    }
  }

  const toggleSelectItem = (item: InventoryItem) => {
    const key = `${item.type}-${item.id}`
    const newSet = new Set(selectedItems)

    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }

    setSelectedItems(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      const newSet = new Set<string>()
      items.forEach(item => {
        newSet.add(`${item.type}-${item.id}`)
      })
      setSelectedItems(newSet)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) {
      toast.error("수정할 항목을 선택해주세요")
      return
    }

    const change = parseInt(bulkStockChange)
    if (isNaN(change)) {
      toast.error("유효한 숫자를 입력해주세요")
      return
    }

    try {
      setBulkUpdating(true)

      const updateItems = Array.from(selectedItems).map(key => {
        const [type, id] = key.split("-")
        const item = items.find(i => i.id === parseInt(id) && i.type === type)

        if (!item) return null

        const newStock = Math.max(0, item.stock + change)

        return {
          id: parseInt(id),
          type,
          newStock,
        }
      }).filter(item => item !== null)

      await apiFetch("/api/admin/inventory/bulk-update", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ items: updateItems }),
      })

      toast.success(`${updateItems.length}개 항목 수정 완료`)
      setBulkDialogOpen(false)
      setBulkStockChange("")
      setSelectedItems(new Set())
      fetchItems()
      fetchStatistics()
    } catch (error) {
      console.error("Error bulk updating:", error)
      toast.error("일괄 수정에 실패했습니다")
    } finally {
      setBulkUpdating(false)
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "SOLD_OUT":
        return <Badge variant="destructive">품절</Badge>
      case "LOW_STOCK":
        return <Badge className="bg-orange-500">재고부족</Badge>
      case "IN_STOCK":
        return <Badge className="bg-green-500">정상</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">재고 관리</h1>
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
              <CardTitle className="text-sm font-medium">전체 항목</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                총 재고 가치: {statistics.totalStockValue.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">품절</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{statistics.totalSoldOut}</div>
              <p className="text-xs text-muted-foreground">
                재고 0개 상품
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">재고부족</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{statistics.totalLowStock}</div>
              <p className="text-xs text-muted-foreground">
                임계값 이하 상품
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">정상 재고</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{statistics.totalInStock}</div>
              <p className="text-xs text-muted-foreground">
                충분한 재고
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
          <div className="flex gap-4">
            <Select value={stockStatus} onValueChange={(value) => { setStockStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="재고 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="SOLD_OUT">품절</SelectItem>
                <SelectItem value="LOW_STOCK">재고부족</SelectItem>
                <SelectItem value="IN_STOCK">정상</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="상품명 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.size}개 항목 선택됨
              </span>
              <Button onClick={() => setBulkDialogOpen(true)}>
                일괄 재고 수정
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>재고 목록 ({totalElements}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <AdminLoadingSpinner type="table" />
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              재고 항목이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size === items.length && items.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>타입</TableHead>
                    <SortableTableHead
                      sortKey="name"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      상품명
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="category"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      카테고리
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="stock"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      재고
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="threshold"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      임계값
                    </SortableTableHead>
                    <TableHead>상태</TableHead>
                    <SortableTableHead
                      sortKey="stockValue"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      재고 가치
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isEditing = editingId === item.id
                    const isSelected = selectedItems.has(`${item.type}-${item.id}`)

                    return (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type === "PRODUCT" ? "상품" : "옵션"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className={item.type === "OPTION" ? "pl-4 text-sm" : "font-medium"}>
                              {item.name}
                            </div>
                            {item.type === "OPTION" && (
                              <div className="pl-4 text-xs text-muted-foreground">
                                {item.parentProductName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          {isEditing && editingField === "stock" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20"
                                autoFocus
                              />
                              <Button size="sm" onClick={saveEdit}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{item.stock}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(item, "stock")}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.type === "PRODUCT" ? (
                            isEditing && editingField === "threshold" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-20"
                                  autoFocus
                                />
                                <Button size="sm" onClick={saveEdit}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{item.lowStockThreshold}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(item, "threshold")}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(item.stockStatus)}</TableCell>
                        <TableCell>{item.stockValue.toLocaleString()}원</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="py-4">
                  <AdminPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    itemsPerPage={20}
                    onPageChange={(newPage) => {
                      setPage(newPage)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재고 일괄 수정</DialogTitle>
            <DialogDescription>
              선택된 {selectedItems.size}개 항목의 재고를 일괄 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">재고 증감</label>
              <Input
                type="number"
                placeholder="예: +10 (증가) 또는 -5 (감소)"
                value={bulkStockChange}
                onChange={(e) => setBulkStockChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                양수는 재고 증가, 음수는 재고 감소 (최소 0개까지)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              취소
            </Button>
            <LoadingButton onClick={handleBulkUpdate} isLoading={bulkUpdating} loadingText="수정 중...">
              수정
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
