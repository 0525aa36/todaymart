import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | null

interface SortableTableHeadProps {
  children: React.ReactNode
  sortKey: string
  currentSortKey: string | null
  currentSortDirection: SortDirection
  onSort: (key: string) => void
  className?: string
  align?: "left" | "center" | "right"
}

export function SortableTableHead({
  children,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className,
  align = "left",
}: SortableTableHeadProps) {
  const isActive = currentSortKey === sortKey
  const alignmentClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  return (
    <TableHead className={cn("select-none", className)}>
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 w-full font-medium transition-colors hover:text-primary",
          alignmentClass[align],
          isActive && "text-primary"
        )}
      >
        {children}
        <span className="ml-1">
          {!isActive && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
          {isActive && currentSortDirection === "asc" && (
            <ArrowUp className="h-3.5 w-3.5" />
          )}
          {isActive && currentSortDirection === "desc" && (
            <ArrowDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
    </TableHead>
  )
}
