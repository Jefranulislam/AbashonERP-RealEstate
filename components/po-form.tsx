'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/ui/date-field'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculateLineAmount, calculatePOTotals, formatCurrency, validateLineItem } from '@/lib/po-calculations'

interface POLineItem {
  id?: string
  expenseHeadId?: number
  expenseHeadName?: string
  description?: string
  qty: number
  rate: number
  unitOfMeasurement?: string
}

interface POFormProps {
  vendors?: Array<{ id: number; vendor_name: string }>
  projects?: Array<{ id: number; project_name: string }>
  expenseHeads?: Array<{ id: number; head_name: string }>
  onSubmit: (data: {
    vendorId?: number
    projectId?: number
    orderDate?: string
    expectedDeliveryDate?: string
    items: POLineItem[]
    discountPercentage?: number
    taxPercentage?: number
    totalAmount: number
    paymentTerms?: string
    deliveryTerms?: string
    notes?: string
  }) => Promise<void>
  loading?: boolean
}

export function POForm({
  vendors = [],
  projects = [],
  expenseHeads = [],
  onSubmit,
  loading = false,
}: POFormProps) {
  const [formData, setFormData] = useState({
    vendorId: '',
    projectId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
    discountPercentage: 0,
    taxPercentage: 0,
  })

  const [items, setItems] = useState<POLineItem[]>([])
  const [newItem, setNewItem] = useState<POLineItem>({
    qty: 0,
    rate: 0,
    expenseHeadId: undefined,
  })

  // Calculate totals automatically
  const totals = useMemo(() => {
    return calculatePOTotals(items, formData.discountPercentage, formData.taxPercentage)
  }, [items, formData.discountPercentage, formData.taxPercentage])

  const addItem = () => {
    const validation = validateLineItem(newItem)
    if (!validation.valid) {
      alert('Please fill in all item details:\n' + validation.errors.join('\n'))
      return
    }

    if (!newItem.expenseHeadId) {
      alert('Please select an expense head')
      return
    }

    const selectedHead = expenseHeads.find((h) => h.id === newItem.expenseHeadId)

    setItems([
      ...items,
      {
        ...newItem,
        id: `${Date.now()}-${Math.random()}`,
        expenseHeadName: selectedHead?.head_name,
      },
    ])

    setNewItem({
      qty: 0,
      rate: 0,
      expenseHeadId: undefined,
    })
  }

  const removeItem = (id: string | undefined) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      alert('Please add at least one item')
      return
    }

    await onSubmit({
      vendorId: formData.vendorId ? Number(formData.vendorId) : undefined,
      projectId: formData.projectId ? Number(formData.projectId) : undefined,
      orderDate: formData.orderDate || undefined,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      items,
      discountPercentage: formData.discountPercentage,
      taxPercentage: formData.taxPercentage,
      totalAmount: totals.totalAmount,
      paymentTerms: formData.paymentTerms || undefined,
      deliveryTerms: formData.deliveryTerms || undefined,
      notes: formData.notes || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
          <CardDescription>
            Add items to the PO. Quantities and rates are calculated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor (Optional)</Label>
                <Select
                  value={formData.vendorId || "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, vendorId: val === "none" ? "" : val })
                  }
                >
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select
                  value={formData.projectId || "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, projectId: val === "none" ? "" : val })
                  }
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <DateField
                  id="orderDate"
                  value={formData.orderDate}
                  onChange={(v) =>
                    setFormData({ ...formData, orderDate: v })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
                <DateField
                  id="expectedDelivery"
                  value={formData.expectedDeliveryDate}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      expectedDeliveryDate: v,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax %</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <hr />

            {/* Add Items */}
            <div>
              <h3 className="font-semibold mb-4">Add Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="expenseHead">Expense Head</Label>
                  <Select
                    value={newItem.expenseHeadId?.toString() || ''}
                    onValueChange={(val) =>
                      setNewItem({
                        ...newItem,
                        expenseHeadId: val ? Number(val) : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="expenseHead" size="sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseHeads.map((head) => (
                        <SelectItem key={head.id} value={head.id.toString()}>
                          {head.head_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newQty">Qty</Label>
                  <Input
                    id="newQty"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newItem.qty || ''}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        qty: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newRate">Rate (৳)</Label>
                  <Input
                    id="newRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newItem.rate || ''}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="e.g., pcs, kg"
                    value={newItem.unitOfMeasurement || ''}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        unitOfMeasurement: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addItem}
                    className="w-full"
                    variant="outline"
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Auto-calculated Amount */}
              {(newItem.qty || newItem.rate) && (
                <div className="text-sm text-blue-600 mb-3">
                  Auto-calculated amount: {formatCurrency(calculateLineAmount(newItem.qty, newItem.rate))}
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Items ({items.length})</h3>
                <div className="overflow-x-auto border rounded">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Head</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate (৳)</TableHead>
                        <TableHead className="text-right">Amount (৳)</TableHead>
                        <TableHead className="w-12">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.expenseHeadName || '-'}
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.rate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(calculateLineAmount(item.qty, item.rate))}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Totals Summary */}
            {items.length > 0 && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>
                          Discount ({totals.discountPercentage}%):
                        </span>
                        <span className="font-semibold">
                          -{formatCurrency(totals.discountAmount)}
                        </span>
                      </div>
                    )}
                    {totals.taxAmount > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Tax ({totals.taxPercentage}%):</span>
                        <span className="font-semibold">
                          +{formatCurrency(totals.taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">
                        {formatCurrency(totals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  placeholder="e.g., 50% Advance, 50% on Delivery"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                <Input
                  id="deliveryTerms"
                  placeholder="e.g., FOB, CIF"
                  value={formData.deliveryTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryTerms: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={loading || items.length === 0} className="w-full">
              {loading ? 'Creating PO...' : `Create PO - ${formatCurrency(totals.totalAmount)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
