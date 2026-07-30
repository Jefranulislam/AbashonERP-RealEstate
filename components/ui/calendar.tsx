"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/** Thin wrapper around react-day-picker used inside DateField's popover. */
export function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn("p-3", className)} {...props} />
}
