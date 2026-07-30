/**
 * Purchase Order Calculation Utilities
 * Used for real-time calculations in PO forms
 * NOT used during import (import accepts data as-is)
 */

export interface POLineItem {
  qty: number
  rate: number
  amount?: number
}

export interface POCalculation {
  qty: number
  rate: number
  lineAmount: number
  subtotal: number
  discountPercentage: number
  discountAmount: number
  taxPercentage: number
  taxAmount: number
  totalAmount: number
}

/**
 * Calculate line item amount (qty × rate)
 */
export function calculateLineAmount(qty: number, rate: number): number {
  return Math.max(0, (qty || 0) * (rate || 0))
}

/**
 * Calculate all PO totals
 */
export function calculatePOTotals(
  items: POLineItem[],
  discountPercentage: number = 0,
  taxPercentage: number = 0
): POCalculation {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const lineAmount = calculateLineAmount(item.qty, item.rate)
    return sum + lineAmount
  }, 0)

  // Calculate discount
  const discountAmount = (subtotal * (discountPercentage || 0)) / 100

  // Calculate taxable amount
  const taxableAmount = subtotal - discountAmount

  // Calculate tax
  const taxAmount = (taxableAmount * (taxPercentage || 0)) / 100

  // Calculate total
  const totalAmount = taxableAmount + taxAmount

  return {
    qty: items.reduce((sum, item) => sum + (item.qty || 0), 0),
    rate: items.length > 0 ? subtotal / items.length : 0,
    lineAmount: subtotal,
    subtotal,
    discountPercentage: discountPercentage || 0,
    discountAmount,
    taxPercentage: taxPercentage || 0,
    taxAmount,
    totalAmount,
  }
}

/**
 * Format currency for display (Bangladesh Taka)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format number with comma separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-BD').format(Math.round(value))
}

/**
 * Validate line item
 */
export function validateLineItem(item: POLineItem): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!item.qty || item.qty <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (!item.rate || item.rate <= 0) {
    errors.push('Rate must be greater than 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate PO calculation
 */
export function validatePO(calculation: POCalculation): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (calculation.totalAmount <= 0) {
    errors.push('Total amount must be greater than 0')
  }

  if (calculation.discountPercentage < 0 || calculation.discountPercentage > 100) {
    errors.push('Discount percentage must be between 0 and 100')
  }

  if (calculation.taxPercentage < 0 || calculation.taxPercentage > 100) {
    errors.push('Tax percentage must be between 0 and 100')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
