import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
  mobileTitle?: boolean // Used as primary bold title on mobile card
  mobileSubtitle?: boolean // Used as secondary line on mobile card
  hideOnMobile?: boolean
}

export type TableColumn<T> = Column<T>

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T, index: number) => string
  isLoading?: boolean
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
  defaultSortKey?: string
  defaultSortDir?: "asc" | "desc"
  cardTitle?: (row: T) => React.ReactNode
  cardSubtitle?: (row: T) => React.ReactNode
  cardBadge?: (row: T) => React.ReactNode
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  loading = false,
  emptyMessage = "No records found",
  onRowClick,
  className,
  defaultSortKey,
  defaultSortDir = "asc",
  cardTitle,
  cardSubtitle,
  cardBadge,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey)
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir)

  const isTableLoading = isLoading || loading

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === bVal) return 0
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      })
      return sortDir === "asc" ? comparison : -comparison
    })
  }, [data, sortKey, sortDir])

  const mobileTitleCol = columns.find((c) => c.mobileTitle) || columns[0]
  const mobileSubtitleCol = columns.find((c) => c.mobileSubtitle) || columns[1]

  if (isTableLoading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-6 space-y-3">
        <div className="h-6 bg-subtle rounded-md animate-pulse w-1/4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-subtle rounded-md animate-pulse w-full"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Card-Collapse Layout (< 768px, Rule 22) */}
      <div className="block md:hidden space-y-3">
        {sortedData.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-surface p-8 text-center text-sm text-text-secondary">
            {emptyMessage}
          </div>
        ) : (
          sortedData.map((row, index) => (
            <div
              key={keyExtractor(row, index)}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                "rounded-xl border border-border-default bg-surface p-4 space-y-2.5 shadow-sm transition-colors",
                onRowClick && "cursor-pointer active:bg-subtle"
              )}
            >
              {/* Primary Mobile Header */}
              <div className="flex items-start justify-between gap-2 border-b border-border-default pb-2">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {cardTitle
                      ? cardTitle(row)
                      : mobileTitleCol.render
                      ? mobileTitleCol.render(row, index)
                      : row[mobileTitleCol.key]}
                  </div>
                  {(cardSubtitle || mobileSubtitleCol) && (
                    <div className="text-xs text-text-secondary mt-0.5">
                      {cardSubtitle
                        ? cardSubtitle(row)
                        : mobileSubtitleCol?.render
                        ? mobileSubtitleCol.render(row, index)
                        : row[mobileSubtitleCol?.key || ""]}
                    </div>
                  )}
                </div>

                {cardBadge && <div>{cardBadge(row)}</div>}
              </div>

              {/* Other Key-Value Pairs */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {columns
                  .filter(
                    (col) =>
                      col.key !== mobileTitleCol.key &&
                      col.key !== (mobileSubtitleCol?.key || "") &&
                      !col.hideOnMobile
                  )
                  .map((col) => (
                    <div key={col.key} className="space-y-0.5">
                      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                        {col.header}
                      </span>
                      <div className="text-text-primary font-medium">
                        {col.render ? col.render(row, index) : row[col.key]}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= 768px) with internal overflow container */}
      <div className="hidden md:block rounded-xl border border-border-default bg-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-subtle border-b border-border-default">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={cn(
                      "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted select-none whitespace-nowrap",
                      col.sortable &&
                        "cursor-pointer hover:text-text-primary transition-colors",
                      col.className
                    )}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-text-muted">
                          {sortKey === col.key ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-text-primary" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-text-primary" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-sm text-text-secondary"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr
                    key={keyExtractor(row, index)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "h-12 transition-colors hover:bg-subtle",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-2 text-text-primary", col.className)}
                      >
                        {col.render ? col.render(row, index) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
