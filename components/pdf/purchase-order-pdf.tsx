'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface POItem {
  expense_head_name?: string
  material_type?: string
  material_specification?: string
  unit_of_measurement?: string
  qty: number | string
  rate: number | string
  amount: number | string
}

interface PaymentSchedule {
  payment_type?: string
  scheduled_amount?: number | string
  due_date?: string
  status?: string
}

export interface PurchaseOrderPDFData {
  po_number: string
  order_date: string
  expected_delivery_date?: string
  status?: string
  vendor_name?: string
  vendor_phone?: string
  vendor_email?: string
  vendor_address?: string
  project_name?: string
  subtotal?: number | string
  discount_percentage?: number | string
  discount_amount?: number | string
  tax_percentage?: number | string
  tax_amount?: number | string
  total_amount?: number | string
  total_paid?: number | string
  total_due?: number | string
  payment_status?: string
  payment_terms?: string
  delivery_terms?: string
  notes?: string
  prepared_by_name?: string
  approved_by_name?: string
  approval_date?: string
  items?: POItem[]
  schedules?: PaymentSchedule[]
}

interface PurchaseOrderPDFProps {
  order: PurchaseOrderPDFData
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
}

export function PurchaseOrderPDF({
  order,
  companyName,
  companyAddress,
  currencySymbol = '৳',
  companyLogo,
  footerImage,
  backgroundImage,
}: PurchaseOrderPDFProps) {
  const items = order.items || []
  const schedules = order.schedules || []

  return (
    <PDFTemplate
      title="PURCHASE ORDER"
      documentNumber={order.po_number}
      date={formatDateForPDF(order.order_date)}
      companyName={companyName}
      companyAddress={companyAddress}
      companyLogo={companyLogo}
      footerImage={footerImage}
      backgroundImage={backgroundImage}
    >
      <div className="grid grid-cols-2 gap-8 mb-6">
        <PDFSection title="Vendor">
          <div className="space-y-1">
            <p className="font-bold text-base">{order.vendor_name || 'N/A'}</p>
            {order.vendor_phone && (
              <p className="text-sm text-gray-700">Phone: {order.vendor_phone}</p>
            )}
            {order.vendor_email && (
              <p className="text-sm text-gray-700">Email: {order.vendor_email}</p>
            )}
            {order.vendor_address && (
              <p className="text-sm text-gray-700">{order.vendor_address}</p>
            )}
          </div>
        </PDFSection>

        <PDFSection title="Order Details">
          <div className="space-y-1">
            <PDFInfoRow label="PO Number" value={order.po_number} />
            <PDFInfoRow label="Order Date" value={formatDateForPDF(order.order_date)} />
            {order.expected_delivery_date && (
              <PDFInfoRow
                label="Expected Delivery"
                value={formatDateForPDF(order.expected_delivery_date)}
              />
            )}
            <PDFInfoRow label="Project" value={order.project_name || 'N/A'} />
            {order.status && <PDFInfoRow label="Status" value={order.status} />}
          </div>
        </PDFSection>
      </div>

      <PDFSection title="Order Items">
        <PDFTable
          headers={['#', 'Expense Head', 'Material', 'Specification', 'Unit', 'Qty', 'Rate', 'Amount']}
          rows={items.map((item, index) => ({
            no: (index + 1).toString(),
            expenseHead: item.expense_head_name || '-',
            material: item.material_type || '-',
            specification: item.material_specification || '-',
            unit: item.unit_of_measurement || '-',
            qty: String(item.qty),
            rate: formatCurrency(parseFloat(String(item.rate)) || 0, currencySymbol),
            amount: formatCurrency(parseFloat(String(item.amount)) || 0, currencySymbol),
          }))}
          columns={['no', 'expenseHead', 'material', 'specification', 'unit', 'qty', 'rate', 'amount']}
        />
      </PDFSection>

      <div className="flex justify-end mt-6">
        <div className="w-80 space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(parseFloat(String(order.subtotal)) || 0, currencySymbol)}</span>
          </div>
          {(parseFloat(String(order.discount_amount)) || 0) > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300 text-red-600">
              <span className="font-medium">
                Discount ({order.discount_percentage || 0}%):
              </span>
              <span>
                - {formatCurrency(parseFloat(String(order.discount_amount)) || 0, currencySymbol)}
              </span>
            </div>
          )}
          {(parseFloat(String(order.tax_amount)) || 0) > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-medium">Tax ({order.tax_percentage || 0}%):</span>
              <span>{formatCurrency(parseFloat(String(order.tax_amount)) || 0, currencySymbol)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-800 text-lg font-bold">
            <span>Total Amount:</span>
            <span>{formatCurrency(parseFloat(String(order.total_amount)) || 0, currencySymbol)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-300 text-green-600">
            <span className="font-medium">Paid:</span>
            <span>{formatCurrency(parseFloat(String(order.total_paid)) || 0, currencySymbol)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-bold text-red-600">
            <span>Due:</span>
            <span>{formatCurrency(parseFloat(String(order.total_due)) || 0, currencySymbol)}</span>
          </div>
          {order.payment_status && (
            <div className="flex justify-between py-2">
              <span className="font-medium">Payment Status:</span>
              <span>{order.payment_status}</span>
            </div>
          )}
        </div>
      </div>

      {schedules.length > 0 && (
        <PDFSection title="Payment Schedule">
          <PDFTable
            headers={['Type', 'Scheduled Amount', 'Due Date', 'Status']}
            rows={schedules.map((schedule) => ({
              type: schedule.payment_type || '-',
              amount: formatCurrency(
                parseFloat(String(schedule.scheduled_amount)) || 0,
                currencySymbol
              ),
              dueDate: schedule.due_date ? formatDateForPDF(schedule.due_date) : '-',
              status: schedule.status || 'Pending',
            }))}
            columns={['type', 'amount', 'dueDate', 'status']}
          />
        </PDFSection>
      )}

      {(order.payment_terms || order.delivery_terms) && (
        <PDFSection title="Terms">
          {order.payment_terms && <PDFInfoRow label="Payment Terms" value={order.payment_terms} />}
          {order.delivery_terms && <PDFInfoRow label="Delivery Terms" value={order.delivery_terms} />}
        </PDFSection>
      )}

      {order.notes && (
        <PDFSection title="Notes">
          <p className="text-sm text-gray-700">{order.notes}</p>
        </PDFSection>
      )}

      <div className="mt-12 grid grid-cols-2 gap-8 text-center">
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Prepared By</p>
            <p className="text-xs text-gray-600 mt-1">{order.prepared_by_name || ''}</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Approved By</p>
            <p className="text-xs text-gray-600 mt-1">
              {order.approved_by_name || 'Pending'}
              {order.approval_date ? ` (${formatDateForPDF(order.approval_date)})` : ''}
            </p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
