"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronFirst, ChevronLast } from "lucide-react"

interface AdminPaginationProps {
  currentPage: number // 0-based index
  totalPages: number
  totalElements?: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (size: number) => void
  showItemsPerPage?: boolean
  maxVisiblePages?: number
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  itemsPerPage = 20,
  onItemsPerPageChange,
  showItemsPerPage = false,
  maxVisiblePages = 7,
}: AdminPaginationProps) {
  // 페이지가 없는 경우
  if (totalPages === 0) {
    return null
  }

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []

    // 총 페이지가 maxVisiblePages 이하면 모두 표시
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    // 항상 첫 페이지 표시
    pages.push(0)

    // 중간 페이지 계산
    const halfVisible = Math.floor((maxVisiblePages - 2) / 2) // 첫/마지막 페이지 제외
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages - 2, currentPage + halfVisible)

    // 시작 또는 끝에 가까울 때 조정
    if (currentPage <= halfVisible + 1) {
      endPage = Math.min(totalPages - 2, maxVisiblePages - 2)
    } else if (currentPage >= totalPages - halfVisible - 2) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1)
    }

    // 첫 페이지 다음에 ellipsis 필요한지 확인
    if (startPage > 1) {
      pages.push("ellipsis")
    }

    // 중간 페이지들 추가
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // 마지막 페이지 전에 ellipsis 필요한지 확인
    if (endPage < totalPages - 2) {
      pages.push("ellipsis")
    }

    // 항상 마지막 페이지 표시
    if (totalPages > 1) {
      pages.push(totalPages - 1)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  // 현재 표시 중인 항목 범위 계산
  const getItemRange = () => {
    if (!totalElements) return null
    const start = currentPage * itemsPerPage + 1
    const end = Math.min((currentPage + 1) * itemsPerPage, totalElements)
    return { start, end }
  }

  const itemRange = getItemRange()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* 총 항목 수 표시 */}
      <div className="text-sm text-gray-600">
        {itemRange ? (
          <span>
            총 <span className="font-medium">{totalElements}</span>개 중{" "}
            <span className="font-medium">{itemRange.start}</span>-
            <span className="font-medium">{itemRange.end}</span> 표시
          </span>
        ) : (
          <span>
            페이지 <span className="font-medium">{currentPage + 1}</span> /{" "}
            <span className="font-medium">{totalPages}</span>
          </span>
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination>
        <PaginationContent>
          {/* 처음 페이지 */}
          <PaginationItem>
            <button
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              aria-label="처음 페이지로"
            >
              <ChevronFirst className="h-4 w-4" />
            </button>
          </PaginationItem>

          {/* 이전 페이지 */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              aria-disabled={currentPage === 0}
              className={
                currentPage === 0
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* 페이지 번호들 */}
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }

            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          {/* 다음 페이지 */}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                onPageChange(Math.min(totalPages - 1, currentPage + 1))
              }
              aria-disabled={currentPage >= totalPages - 1}
              className={
                currentPage >= totalPages - 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* 마지막 페이지 */}
          <PaginationItem>
            <button
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              aria-label="마지막 페이지로"
            >
              <ChevronLast className="h-4 w-4" />
            </button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* 페이지당 항목 수 선택 */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">페이지당</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">개</span>
        </div>
      )}
    </div>
  )
}
