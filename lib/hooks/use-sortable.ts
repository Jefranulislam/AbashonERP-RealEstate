"use client"

import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export interface SortState {
  key: string | null
  direction: SortDirection
}

/**
 * Reusable client-side table sorting.
 *
 * Pass the rows and a map of column-key -> accessor. `requestSort(key)` toggles
 * asc/desc (and switches column). Values are compared smartly: real dates by
 * time, numbers numerically, everything else case-insensitively as strings.
 * Nullish values always sort last regardless of direction.
 */
export function useSortable<T>(
  items: T[],
  accessors: Record<string, (item: T) => unknown>,
  initial: SortState = { key: null, direction: "asc" },
) {
  const [sort, setSort] = useState<SortState>(initial)

  const requestSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    )
  }

  const sorted = useMemo(() => {
    if (!sort.key) return items
    const accessor = accessors[sort.key]
    if (!accessor) return items

    const factor = sort.direction === "asc" ? 1 : -1
    const copy = [...items]
    copy.sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)

      const aEmpty = av === null || av === undefined || av === ""
      const bEmpty = bv === null || bv === undefined || bv === ""
      if (aEmpty && bEmpty) return 0
      if (aEmpty) return 1 // nullish last
      if (bEmpty) return -1

      // Dates
      const ad = av instanceof Date ? av.getTime() : Date.parse(String(av))
      const bd = bv instanceof Date ? bv.getTime() : Date.parse(String(bv))
      const looksLikeDate = typeof av !== "number" && typeof bv !== "number" && !Number.isNaN(ad) && !Number.isNaN(bd) &&
        /[-/:]/.test(String(av)) && /[-/:]/.test(String(bv))
      if (looksLikeDate) return (ad - bd) * factor

      // Numbers
      const an = typeof av === "number" ? av : Number(av)
      const bn = typeof bv === "number" ? bv : Number(bv)
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return (an - bn) * factor

      // Strings
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * factor
    })
    return copy
  }, [items, accessors, sort])

  return { sorted, sort, requestSort }
}
