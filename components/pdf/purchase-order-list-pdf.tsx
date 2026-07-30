'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

export interface PurchaseOrderListRow {
  po_number: string
  order_date: string
  vendor_name?: string
  project_name?: string
  total_amount?: number | string
  total_paid?: number | string
  total_due?: number | string
  payment_status?: string
  status?: string
}

interface PurchaseOrderListPDFProps {
  orders: PurchaseOrderListRow[]
  title?: string
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
}

export function PurchaseOrderListPDF({
  orders,
  title = 'Purchase Orders Report',
  companyName,
  companyAddress,
  currencySymbol = '৳',
  companyLogo,
  footerImage,
  backgroundImage,
}: PurchaseOrderListPDFProps) {
  const totalAmount = orders.reduce(
    (sum, order) => sum + (parseFloat(String(order.total_amount)) || 0),
    0
  )
  const totalPaid = orders.reduce(
    (sum, order) => sum + (parseFloat(String(order.total_paid)) || 0),
    0
  )
  const totalDue = orders.reduce(
    (sum, order) => sum + (parseFloat(String(order.total_due)) || 0),
    0
  )

  return (
    <PDFTemplate
      title={title}
      date={formatDateForPDF(new Date().toISOString())}
      companyName={companyName}
      companyAddress={companyAddress}
      companyLogo={companyLogo}
      footerImage={footerImage}
      backgroundImage={backgroundImage}
    >
      <PDFSection title={`Purchase Orders (${orders.length})`}>
        <PDFTable
          headers={[
            '#',
            'PO Number',
            'Order Date',
            'Vendor',
            'Project',
            'Total',
            'Paid',
            'Due',
            'Payment',
            'Status',
          ]}
          rows={orders.map((order, index) => ({
            no: (index + 1).toString(),
            poNumber: order.po_number,
            orderDate: formatDateForPDF(order.order_date),
            vendor: order.vendor_name || '-',
            project: order.project_name || '-',
            total: formatCurrency(parseFloat(String(order.total_amount)) || 0, currencySymbol),
            paid: formatCurrency(parseFloat(String(order.total_paid)) || 0, currencySymbol),
            due: formatCurrency(parseFloat(String(order.total_due)) || 0, currencySymbol),
            payment: order.payment_status || '-',
            status: order.status || '-',
          }))}
          columns={[
            'no',
            'poNumber',
            'orderDate',
            'vendor',
            'project',
            'total',
            'paid',
            'due',
            'payment',
            'status',
          ]}
          footerRow={{
            label: 'Total',
            colspan: 5,
            value: `${formatCurrency(totalAmount, currencySymbol)} | Paid: ${formatCurrency(totalPaid, currencySymbol)} | Due: ${formatCurrency(totalDue, currencySymbol)}`,
          }}
        />
      </PDFSection>
    </PDFTemplate>
  )
}
