"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Copy } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

export interface PaymentScheduleItem {
  id: string
  type: 'booking' | 'down_payment' | 'installment' | 'custom'
  label: string
  percentage: string
  amount: string
  month: string
  year: string
}

interface DynamicPaymentPlanProps {
  totalAmount: number
  bookingAmount: string
  downPayment: string
  onScheduleChange: (schedules: PaymentScheduleItem[]) => void
  initialSchedules?: PaymentScheduleItem[]
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString())

export function DynamicPaymentPlan({
  totalAmount,
  bookingAmount,
  downPayment,
  onScheduleChange,
  initialSchedules = [],
}: DynamicPaymentPlanProps) {
  const { formatAmount } = useCurrency()
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>(initialSchedules)

  // Calculate already allocated amount
  const bookingAmt = parseFloat(bookingAmount) || 0
  const downPaymentAmt = parseFloat(downPayment) || 0
  const fixedPayments = bookingAmt + downPaymentAmt

  const scheduledAmount = schedules.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  const remainingAmount = totalAmount - fixedPayments - scheduledAmount

  // Generate unique ID
  const generateId = () => `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add new installment
  const addInstallment = useCallback(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + schedules.length + 2) // Start after down payment period
    
    const newSchedule: PaymentScheduleItem = {
      id: generateId(),
      type: 'installment',
      label: `${getOrdinal(schedules.length + 1)} Installment`,
      percentage: "",
      amount: "",
      month: (nextMonth.getMonth() + 1).toString(),
      year: nextMonth.getFullYear().toString(),
    }
    
    const updated = [...schedules, newSchedule]
    setSchedules(updated)
    onScheduleChange(updated)
  }, [schedules, onScheduleChange])

  // Duplicate an installment
  const duplicateInstallment = useCallback((index: number) => {
    const source = schedules[index]
    const nextMonth = new Date(parseInt(source.year), parseInt(source.month), 1)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    const newSchedule: PaymentScheduleItem = {
      id: generateId(),
      type: 'installment',
      label: `${getOrdinal(schedules.length + 1)} Installment`,
      percentage: source.percentage,
      amount: source.amount,
      month: (nextMonth.getMonth() + 1).toString(),
      year: nextMonth.getFullYear().toString(),
    }
    
    const updated = [...schedules, newSchedule]
    setSchedules(updated)
    onScheduleChange(updated)
  }, [schedules, onScheduleChange])

  // Remove installment
  const removeInstallment = useCallback((index: number) => {
    const updated = schedules.filter((_, i) => i !== index)
    // Relabel remaining installments
    const relabeled = updated.map((s, i) => ({
      ...s,
      label: s.type === 'installment' ? `${getOrdinal(i + 1)} Installment` : s.label,
    }))
    setSchedules(relabeled)
    onScheduleChange(relabeled)
  }, [schedules, onScheduleChange])

  // Update a schedule item
  const updateSchedule = useCallback((index: number, field: keyof PaymentScheduleItem, value: string) => {
    const updated = [...schedules]
    updated[index] = { ...updated[index], [field]: value }
    
    // If percentage changed, calculate amount
    if (field === 'percentage' && value) {
      const pct = parseFloat(value) || 0
      updated[index].amount = ((totalAmount * pct) / 100).toFixed(2)
    }
    // If amount changed, calculate percentage
    else if (field === 'amount' && value && totalAmount > 0) {
      const amt = parseFloat(value) || 0
      updated[index].percentage = ((amt / totalAmount) * 100).toFixed(2)
    }
    
    setSchedules(updated)
    onScheduleChange(updated)
  }, [schedules, totalAmount, onScheduleChange])

  // Get ordinal suffix
  function getOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Price:</span>
            <span className="font-bold">{formatAmount(totalAmount)}</span>
          </div>
          {bookingAmt > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Booking Amount:</span>
              <span>- {formatAmount(bookingAmt)}</span>
            </div>
          )}
          {downPaymentAmt > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Down Payment:</span>
              <span>- {formatAmount(downPaymentAmt)}</span>
            </div>
          )}
          {scheduledAmount > 0 && (
            <div className="flex justify-between text-purple-600">
              <span>Scheduled ({schedules.length} installments):</span>
              <span>- {formatAmount(scheduledAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t font-bold">
            <span>Remaining to Schedule:</span>
            <span className={remainingAmount > 0 ? 'text-orange-600' : remainingAmount < 0 ? 'text-red-600' : 'text-green-600'}>
              {formatAmount(remainingAmount)}
            </span>
          </div>
          {remainingAmount < 0 && (
            <p className="text-xs text-red-600">
              ⚠️ Scheduled amount exceeds total price
            </p>
          )}
        </CardContent>
      </Card>

      {/* Installments List */}
      <div className="space-y-3">
        {schedules.map((schedule, index) => (
          <Card key={schedule.id} className="p-3">
            <div className="grid grid-cols-12 gap-2 items-end">
              {/* Label */}
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={schedule.label}
                  onChange={(e) => updateSchedule(index, 'label', e.target.value)}
                  placeholder="Payment label"
                  className="h-9"
                />
              </div>
              
              {/* Percentage */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">%</Label>
                <Input
                  type="number"
                  step="0.01"
                  max="100"
                  value={schedule.percentage}
                  onChange={(e) => updateSchedule(index, 'percentage', e.target.value)}
                  placeholder="%"
                  className="h-9"
                />
              </div>
              
              {/* Amount */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={schedule.amount}
                  onChange={(e) => updateSchedule(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="h-9"
                />
              </div>
              
              {/* Month */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Month</Label>
                <Select
                  value={schedule.month}
                  onValueChange={(v) => updateSchedule(index, 'month', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Year */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Year</Label>
                <Select
                  value={schedule.year}
                  onValueChange={(v) => updateSchedule(index, 'year', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Actions */}
              <div className="col-span-1 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => duplicateInstallment(index)}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-600 hover:text-red-700"
                  onClick={() => removeInstallment(index)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addInstallment}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Installment
      </Button>

      {/* Quick Add Buttons */}
      {remainingAmount > 0 && schedules.length === 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              // Add equal monthly installments
              const months = 12
              const amountPerMonth = remainingAmount / months
              const newSchedules: PaymentScheduleItem[] = []
              const startDate = new Date()
              startDate.setMonth(startDate.getMonth() + 2) // Start 2 months from now
              
              for (let i = 0; i < months; i++) {
                const date = new Date(startDate)
                date.setMonth(date.getMonth() + i)
                newSchedules.push({
                  id: generateId(),
                  type: 'installment',
                  label: `${getOrdinal(i + 1)} Installment`,
                  percentage: ((amountPerMonth / totalAmount) * 100).toFixed(2),
                  amount: amountPerMonth.toFixed(2),
                  month: (date.getMonth() + 1).toString(),
                  year: date.getFullYear().toString(),
                })
              }
              setSchedules(newSchedules)
              onScheduleChange(newSchedules)
            }}
          >
            12 Equal Installments
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const months = 24
              const amountPerMonth = remainingAmount / months
              const newSchedules: PaymentScheduleItem[] = []
              const startDate = new Date()
              startDate.setMonth(startDate.getMonth() + 2)
              
              for (let i = 0; i < months; i++) {
                const date = new Date(startDate)
                date.setMonth(date.getMonth() + i)
                newSchedules.push({
                  id: generateId(),
                  type: 'installment',
                  label: `${getOrdinal(i + 1)} Installment`,
                  percentage: ((amountPerMonth / totalAmount) * 100).toFixed(2),
                  amount: amountPerMonth.toFixed(2),
                  month: (date.getMonth() + 1).toString(),
                  year: date.getFullYear().toString(),
                })
              }
              setSchedules(newSchedules)
              onScheduleChange(newSchedules)
            }}
          >
            24 Equal Installments
          </Button>
        </div>
      )}
    </div>
  )
}
