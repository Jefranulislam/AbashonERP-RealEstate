"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SortState } from "@/lib/hooks/use-sortable"

interface SortableHeaderProps {
  label: string
  sortKey: string
  sort: SortState
  onSort: (key: string) => void
  className?: string
}

/** Clickable table header that reflects the current sort column + direction. */
export function SortableHeader({ label, sortKey, sort, onSort, className }: SortableHeaderProps) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
  return (
    <Button
      variant="ghost"
      onClick={() => onSort(sortKey)}
      className={"h-8 px-2 -ml-2 data-[active=true]:text-foreground " + (className ?? "")}
      data-active={active}
    >
      {label}
      <Icon className={"ml-2 h-4 w-4 " + (active ? "opacity-100" : "opacity-50")} />
    </Button>
  )
}
