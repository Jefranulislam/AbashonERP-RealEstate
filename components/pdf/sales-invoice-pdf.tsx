'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface SalesInvoiceItem {
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

interface SalesInvoicePDFProps {
  invoice: {
    invoice_no: string
    invoice_date: string
    due_date?: string
    customer_name: string
    customer_address?: string
    customer_phone?: string
    project_name?: string
    payment_status: string
    total_amount: number
    paid_amount: number
    discount?: number
    tax?: number
    notes?: string
  }
  items: SalesInvoiceItem[]
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function SalesInvoicePDF({
  invoice,
  items,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: SalesInvoicePDFProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discount = invoice.discount || 0
  const tax = invoice.tax || 0
  const finalTotal = subtotal - discount + tax
  const balanceDue = finalTotal - invoice.paid_amount

  return (
    <PDFTemplate
      title="SALES INVOICE"
      documentNumber={invoice.invoice_no}
      date={formatDateForPDF(invoice.invoice_date)}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Bill To */}
        <PDFSection title="Bill To">
          <div className="space-y-1">
            <p className="font-bold text-base">{invoice.customer_name}</p>
            {invoice.customer_address && (
              <p className="text-sm text-gray-700">{invoice.customer_address}</p>
            )}
            {invoice.customer_phone && (
              <p className="text-sm text-gray-700">Phone: {invoice.customer_phone}</p>
            )}
          </div>
        </PDFSection>

        {/* Invoice Details */}
        <PDFSection title="Invoice Details">
          <div className="space-y-1">
            <PDFInfoRow label="Invoice No" value={invoice.invoice_no} />
            <PDFInfoRow label="Invoice Date" value={formatDateForPDF(invoice.invoice_date)} />
            {invoice.due_date && (
              <PDFInfoRow label="Due Date" value={formatDateForPDF(invoice.due_date)} />
            )}
            {invoice.project_name && (
              <PDFInfoRow label="Project" value={invoice.project_name} />
            )}
            <div className="mt-2">
              <PDFInfoRow 
                label="Payment Status" 
                value={invoice.payment_status.toUpperCase()} 
              />
            </div>
          </div>
        </PDFSection>
      </div>

      <PDFSection title="Items">
        <PDFTable
          headers={['#', 'Product / Service', 'Description', 'Qty', 'Unit Price', 'Total']}
          rows={items.map((item, index) => ({
            no: (index + 1).toString(),
            product: item.product_name,
            description: item.description || '-',
            qty: item.quantity.toString(),
            price: formatCurrency(item.unit_price, currencySymbol),
            total: formatCurrency(item.total, currencySymbol),
          }))}
          columns={['no', 'product', 'description', 'qty', 'price', 'total']}
        />
      </PDFSection>

      {/* Summary */}
      <div className="flex justify-end mt-6">
        <div className="w-80 space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(subtotal, currencySymbol)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300 text-red-600">
              <span className="font-medium">Discount:</span>
              <span>- {formatCurrency(discount, currencySymbol)}</span>
            </div>
          )}
          
          {tax > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-medium">Tax:</span>
              <span>{formatCurrency(tax, currencySymbol)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-t-2 border-gray-800 text-lg font-bold">
            <span>Total Amount:</span>
            <span>{formatCurrency(finalTotal, currencySymbol)}</span>
          </div>
          
          {invoice.paid_amount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300 text-green-600">
              <span className="font-medium">Paid:</span>
              <span>{formatCurrency(invoice.paid_amount, currencySymbol)}</span>
            </div>
          )}
          
          {balanceDue > 0 && (
            <div className="flex justify-between py-2 text-lg font-bold text-red-600">
              <span>Balance Due:</span>
              <span>{formatCurrency(balanceDue, currencySymbol)}</span>
            </div>
          )}
        </div>
      </div>

      {invoice.notes && (
        <PDFSection title="Notes">
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </PDFSection>
      )}

      <div className="mt-12 pt-8 border-t border-gray-300">
        <div className="text-center">
          <p className="text-sm font-medium">Thank you for your business!</p>
        </div>
      </div>
    </PDFTemplate>
  )
}
