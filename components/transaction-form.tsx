'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ReferencePartyType,
  REFERENCE_PARTY_TYPE_LABELS,
  REFERENCE_PARTY_TYPE_DESCRIPTIONS,
  getExpenseHeadPartyRule,
  ExpenseHeadPartyRule,
} from '@/lib/reference-party'

interface TransactionFormProps {
  initialData?: {
    vendorId?: number | null
    vendorName?: string
    referencePartyType?: ReferencePartyType | null
    referencePartyName?: string
    expenseHeadName?: string
    expenseHeadId?: number
    amount?: number
    particulars?: string
  }
  vendors?: Array<{ id: number; vendor_name: string }>
  expenseHeads?: Array<{ id: number; head_name: string }>
  onSubmit: (data: {
    vendorId?: number | null
    referencePartyType?: string | null
    referencePartyName?: string | null
    expenseHeadId?: number
    amount?: number
    particulars?: string
  }) => Promise<void>
  loading?: boolean
  mode?: 'create' | 'edit'
}

export function TransactionForm({
  initialData,
  vendors = [],
  expenseHeads = [],
  onSubmit,
  loading = false,
  mode = 'create',
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    vendorId: initialData?.vendorId || null,
    vendorName: initialData?.vendorName || '',
    referencePartyType: initialData?.referencePartyType || null,
    referencePartyName: initialData?.referencePartyName || '',
    expenseHeadId: initialData?.expenseHeadId || null,
    expenseHeadName: initialData?.expenseHeadName || '',
    amount: initialData?.amount || 0,
    particulars: initialData?.particulars || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [partyRule, setPartyRule] = useState<ExpenseHeadPartyRule | null>(null)

  // Determine party rule when expense head changes
  useEffect(() => {
    if (formData.expenseHeadName) {
      const rule = getExpenseHeadPartyRule(formData.expenseHeadName)
      setPartyRule(rule)
    }
  }, [formData.expenseHeadName])

  // Get expense head name when id changes
  const handleExpenseHeadChange = (headId: string) => {
    const selectedHead = expenseHeads.find((h) => h.id === Number(headId))
    setFormData((prev) => ({
      ...prev,
      expenseHeadId: Number(headId),
      expenseHeadName: selectedHead?.head_name || '',
    }))
  }

  // Get vendor name when id changes
  const handleVendorChange = (vId: string) => {
    const vendorId = vId ? Number(vId) : null
    const selectedVendor = vendors.find((v) => v.id === vendorId)
    setFormData((prev) => ({
      ...prev,
      vendorId,
      vendorName: selectedVendor?.vendor_name || '',
      referencePartyType: vendorId ? 'VENDOR' : null,
      referencePartyName: '',
    }))
  }

  // Handle reference party type change
  const handleReferencePartyTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      referencePartyType: type || null,
      referencePartyName: '', // Clear the name when type changes
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.expenseHeadId) {
      newErrors.expenseHeadId = 'Expense head is required'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    // Validate party data
    if (partyRule === ExpenseHeadPartyRule.VENDOR_REQUIRED) {
      if (!formData.vendorId) {
        newErrors.vendorId = 'Vendor is required for this expense head'
      }
    } else if (partyRule === ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY) {
      if (!formData.referencePartyName) {
        newErrors.referencePartyName = 'Party name is required for this transaction type'
      }
      if (!formData.referencePartyType) {
        newErrors.referencePartyType = 'Party type is required'
      }
    } else {
      // VENDOR_OPTIONAL - at least one must be provided
      if (!formData.vendorId && !formData.referencePartyName) {
        newErrors.vendor = 'Either vendor or party name must be provided'
      }
      if (formData.referencePartyName && !formData.referencePartyType) {
        newErrors.referencePartyType = 'Party type must be specified when party name is provided'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit({
      vendorId: formData.vendorId,
      referencePartyType: formData.referencePartyType,
      referencePartyName: formData.referencePartyName || null,
      expenseHeadId: formData.expenseHeadId || undefined,
      amount: formData.amount,
      particulars: formData.particulars,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Transaction</CardTitle>
        <CardDescription>
          Fill in the transaction details. Party information depends on the expense head type.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Head */}
          <div className="space-y-2">
            <Label htmlFor="expenseHead">Expense Head *</Label>
            <Select
              value={formData.expenseHeadId?.toString() || ''}
              onValueChange={handleExpenseHeadChange}
            >
              <SelectTrigger id="expenseHead">
                <SelectValue placeholder="Select expense head..." />
              </SelectTrigger>
              <SelectContent>
                {expenseHeads.map((head) => (
                  <SelectItem key={head.id} value={head.id.toString()}>
                    {head.head_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expenseHeadId && (
              <p className="text-sm text-red-500">{errors.expenseHeadId}</p>
            )}
          </div>

          {/* Party Rule Information */}
          {partyRule && (
            <Alert>
              <AlertDescription>
                {partyRule === ExpenseHeadPartyRule.VENDOR_REQUIRED
                  ? '✓ Vendor is required for this expense head'
                  : partyRule === ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY
                    ? '✓ Use party name instead of vendor (e.g., land owner, government agency)'
                    : '✓ You can use either a vendor or enter party details'}
              </AlertDescription>
            </Alert>
          )}

          {/* Vendor Selection (conditional) */}
          {partyRule !== ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY && (
            <div className="space-y-2">
              <Label htmlFor="vendor">
                Vendor
                {partyRule === ExpenseHeadPartyRule.VENDOR_REQUIRED && ' *'}
              </Label>
              <Select
                value={formData.vendorId?.toString() || ''}
                onValueChange={handleVendorChange}
              >
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- None (Use party name instead) --</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId}</p>
              )}
            </div>
          )}

          {/* Reference Party Section (conditional) */}
          {partyRule !== ExpenseHeadPartyRule.VENDOR_REQUIRED && (
            <div className="space-y-4 border-l-4 border-blue-200 pl-4">
              <h4 className="font-medium text-sm">Party Information</h4>

              {/* Reference Party Type */}
              <div className="space-y-2">
                <Label htmlFor="refPartyType">
                  Party Type
                  {partyRule === ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY && ' *'}
                </Label>
                <Select
                  value={formData.referencePartyType || ''}
                  onValueChange={handleReferencePartyTypeChange}
                >
                  <SelectTrigger id="refPartyType">
                    <SelectValue placeholder="Select party type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReferencePartyType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {REFERENCE_PARTY_TYPE_LABELS[type as ReferencePartyType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.referencePartyType && (
                  <p className="text-xs text-gray-600">
                    {REFERENCE_PARTY_TYPE_DESCRIPTIONS[formData.referencePartyType as ReferencePartyType]}
                  </p>
                )}
                {errors.referencePartyType && (
                  <p className="text-sm text-red-500">{errors.referencePartyType}</p>
                )}
              </div>

              {/* Reference Party Name */}
              <div className="space-y-2">
                <Label htmlFor="refPartyName">
                  Party Name
                  {partyRule === ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY && ' *'}
                </Label>
                <Input
                  id="refPartyName"
                  placeholder="e.g., Land Owner Name, Government Agency, Consultant Name"
                  value={formData.referencePartyName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      referencePartyName: e.target.value,
                    }))
                  }
                />
                {errors.referencePartyName && (
                  <p className="text-sm text-red-500">{errors.referencePartyName}</p>
                )}
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
          </div>

          {/* Particulars */}
          <div className="space-y-2">
            <Label htmlFor="particulars">Particulars/Description</Label>
            <Input
              id="particulars"
              placeholder="Additional details about this transaction..."
              value={formData.particulars}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  particulars: e.target.value,
                }))
              }
            />
          </div>

          {/* Validation Error Summary */}
          {errors.vendor && (
            <Alert variant="destructive">
              <AlertDescription>{errors.vendor}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Save Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
