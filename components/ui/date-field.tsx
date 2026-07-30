"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

/**
 * Locale-independent date input. Always displays and accepts dd-mm-yyyy, plus a
 * calendar popover. The `value`/`onChange` contract uses ISO `yyyy-mm-dd`
 * strings (same format stored in the DB and used by native date inputs), so it
 * is a near drop-in replacement for `<Input type="date" .../>`.
 *
 *   <DateField value={x} onChange={(iso) => setX(iso)} />
 */

function isoToDMY(iso?: string): string {
  if (!iso) return ""
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso))
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ""
}

function dmyToIso(input: string): string | null {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(input.trim())
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  const dt = new Date(year, month - 1, day)
  // Reject impossible dates (e.g. 31-02-2024) that JS would roll over.
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function isoToDate(iso?: string): Date | undefined {
  if (!iso) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso))
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export interface DateFieldProps {
  value?: string
  onChange: (iso: string) => void
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DateField({
  value,
  onChange,
  id,
  name,
  placeholder = "dd-mm-yyyy",
  required,
  disabled,
  className,
}: DateFieldProps) {
  const [text, setText] = React.useState(isoToDMY(value))
  const [open, setOpen] = React.useState(false)

  // Keep the visible text in sync when the controlled value changes externally.
  React.useEffect(() => {
    setText(isoToDMY(value))
  }, [value])

  const commit = (raw: string) => {
    if (raw.trim() === "") {
      onChange("")
      return
    }
    const iso = dmyToIso(raw)
    if (iso) onChange(iso)
    else setText(isoToDMY(value)) // revert unparseable input
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        name={name}
        value={text}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            tabIndex={-1}
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={isoToDate(value)}
            defaultMonth={isoToDate(value)}
            onSelect={(d) => {
              if (d) onChange(dateToIso(d))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
