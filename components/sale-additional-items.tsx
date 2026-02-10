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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { useCurrency } from "@/hooks/use-currency"

export interface AdditionalItem {
  id: string
  productId: string
  itemType: 'parking' | 'gas_line' | 'utility' | 'other'
  itemName: string
  basePrice: string
  discountAmount: string
  netPrice: string
  selected: boolean
}

interface SaleAdditionalItemsProps {
  projectId: string
  products: any[]
  onItemsChange: (items: AdditionalItem[]) => void
  initialItems?: AdditionalItem[]
}

export function SaleAdditionalItems({
  projectId,
  products,
  onItemsChange,
  initialItems = [],
}: SaleAdditionalItemsProps) {
  const { formatAmount } = useCurrency()
  const [items, setItems] = useState<AdditionalItem[]>(initialItems)

  // Filter products by type
  const parkingProducts = products.filter(p => 
    p.product_type?.toLowerCase().includes('parking')
  )
  const gasLineProducts = products.filter(p => 
    p.product_type?.toLowerCase().includes('gas')
  )
  const otherProducts = products.filter(p => 
    !p.product_type?.toLowerCase().includes('parking') &&
    !p.product_type?.toLowerCase().includes('gas') &&
    !p.product_type?.toLowerCase().includes('residential') &&
    !p.product_type?.toLowerCase().includes('apartment') &&
    !p.product_type?.toLowerCase().includes('commercial') &&
    !p.product_type?.toLowerCase().includes('studio')
  )

  // Generate unique ID
  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Calculate total
  const totalNetPrice = items
    .filter(i => i.selected)
    .reduce((sum, i) => sum + (parseFloat(i.netPrice) || 0), 0)

  // Add new item
  const addItem = useCallback((type: 'parking' | 'gas_line' | 'utility' | 'other') => {
    const newItem: AdditionalItem = {
      id: generateId(),
      productId: "",
      itemType: type,
      itemName: type === 'parking' ? 'Parking Space' : 
                type === 'gas_line' ? 'Gas Line Connection' : 
                type === 'utility' ? 'Utility Charge' : 'Other',
      basePrice: "",
      discountAmount: "0",
      netPrice: "",
      selected: true,
    }
    const updated = [...items, newItem]
    setItems(updated)
    onItemsChange(updated)
  }, [items, onItemsChange])

  // Remove item
  const removeItem = useCallback((index: number) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onItemsChange(updated)
  }, [items, onItemsChange])

  // Update item
  const updateItem = useCallback((index: number, field: keyof AdditionalItem, value: string | boolean) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    
    // If product selected, fill in details
    if (field === 'productId' && value) {
      const product = products.find(p => String(p.id) === value)
      if (product) {
        updated[index].itemName = product.product_name
        updated[index].basePrice = String(product.price || product.base_price || 0)
        updated[index].netPrice = String(product.price || product.base_price || 0)
      }
    }
    
    // If base price or discount changed, recalculate net
    if (field === 'basePrice' || field === 'discountAmount') {
      const base = parseFloat(updated[index].basePrice) || 0
      const discount = parseFloat(updated[index].discountAmount) || 0
      updated[index].netPrice = (base - discount).toFixed(2)
    }
    
    setItems(updated)
    onItemsChange(updated)
  }, [items, products, onItemsChange])

  // Toggle selection
  const toggleSelection = useCallback((index: number) => {
    const updated = [...items]
    updated[index].selected = !updated[index].selected
    setItems(updated)
    onItemsChange(updated)
  }, [items, onItemsChange])

  return (
    <div className="space-y-4">
      {/* Quick Add Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem('parking')}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Parking
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem('gas_line')}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Gas Line
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem('utility')}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Utility
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem('other')}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Other
        </Button>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className={`p-3 ${!item.selected ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-12 gap-2 items-end">
                {/* Checkbox */}
                <div className="col-span-1 flex items-center justify-center pb-2">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleSelection(index)}
                  />
                </div>
                
                {/* Type Badge */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <div className={`
                    text-xs px-2 py-1.5 rounded text-center font-medium
                    ${item.itemType === 'parking' ? 'bg-blue-100 text-blue-800' : ''}
                    ${item.itemType === 'gas_line' ? 'bg-orange-100 text-orange-800' : ''}
                    ${item.itemType === 'utility' ? 'bg-green-100 text-green-800' : ''}
                    ${item.itemType === 'other' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {item.itemType === 'parking' ? 'Parking' : 
                     item.itemType === 'gas_line' ? 'Gas Line' :
                     item.itemType === 'utility' ? 'Utility' : 'Other'}
                  </div>
                </div>

                {/* Product Select or Name */}
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">
                    {item.itemType === 'parking' ? 'Select Parking' :
                     item.itemType === 'gas_line' ? 'Select Gas Line' : 'Item Name'}
                  </Label>
                  {(item.itemType === 'parking' && parkingProducts.length > 0) ? (
                    <Select
                      value={item.productId}
                      onValueChange={(v) => updateItem(index, 'productId', v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select parking" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingProducts.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.product_name} - {formatAmount(p.price || p.base_price || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (item.itemType === 'gas_line' && gasLineProducts.length > 0) ? (
                    <Select
                      value={item.productId}
                      onValueChange={(v) => updateItem(index, 'productId', v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select gas line" />
                      </SelectTrigger>
                      <SelectContent>
                        {gasLineProducts.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.product_name} - {formatAmount(p.price || p.base_price || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      placeholder="Item name"
                      className="h-9"
                    />
                  )}
                </div>
                
                {/* Base Price */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.basePrice}
                    onChange={(e) => updateItem(index, 'basePrice', e.target.value)}
                    placeholder="Price"
                    className="h-9"
                  />
                </div>
                
                {/* Discount */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.discountAmount}
                    onChange={(e) => updateItem(index, 'discountAmount', e.target.value)}
                    placeholder="Discount"
                    className="h-9"
                  />
                </div>
                
                {/* Net Price (readonly) */}
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Net</Label>
                  <div className="h-9 px-2 py-1.5 bg-muted rounded text-sm font-medium">
                    {formatAmount(parseFloat(item.netPrice) || 0)}
                  </div>
                </div>
                
                {/* Remove */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 hover:text-red-700"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Total */}
          <div className="flex justify-end items-center gap-4 pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              Additional Items Total:
            </span>
            <span className="text-lg font-bold">
              {formatAmount(totalNetPrice)}
            </span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No additional items added. Click buttons above to add parking, gas line, or other charges.
        </p>
      )}
    </div>
  )
}
