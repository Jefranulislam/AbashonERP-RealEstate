'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface PaymentSchedule {
  installment_no: number
  schedule_type: string
  due_date: string
  amount: number
  paid_amount: number
  status: string
}

interface PaymentSchedulePDFProps {
  sale: {
    sale_no: string
    booking_date: string
    customer_name: string
    customer_phone?: string
    customer_address?: string
    project_name: string
    product_name: string
    unit_no?: string
    floor_no?: string
    net_price: number
    booking_amount: number
    down_payment?: number
    payment_plan?: string
    installment_count?: number
    expected_handover_date?: string
  }
  schedules: PaymentSchedule[]
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function PaymentSchedulePDF({
  sale,
  schedules,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: PaymentSchedulePDFProps) {
  const totalAmount = schedules.reduce((sum, s) => sum + s.amount, 0)
  const totalPaid = schedules.reduce((sum, s) => sum + s.paid_amount, 0)
  const totalDue = totalAmount - totalPaid

  const getScheduleTypeName = (type: string, no: number): string => {
    switch (type) {
      case 'booking': return 'Booking Amount'
      case 'down_payment': return 'Down Payment'
      case 'installment': return `Installment ${no}`
      case 'milestone': return `Milestone ${no}`
      case 'handover': return 'Handover Payment'
      default: return type
    }
  }

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'paid': return '✓ Paid'
      case 'partial': return '◐ Partial'
      case 'overdue': return '⚠ Overdue'
      default: return '○ Pending'
    }
  }

  return (
    <PDFTemplate
      title="PAYMENT SCHEDULE"
      documentNumber={sale.sale_no}
      date={formatDateForPDF(new Date().toISOString())}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Customer Details */}
        <PDFSection title="Customer">
          <div className="space-y-1">
            <p className="font-bold text-base">{sale.customer_name}</p>
            {sale.customer_phone && (
              <p className="text-sm text-gray-700">Phone: {sale.customer_phone}</p>
            )}
            {sale.customer_address && (
              <p className="text-sm text-gray-700">{sale.customer_address}</p>
            )}
          </div>
        </PDFSection>

        {/* Property Details */}
        <PDFSection title="Property">
          <div className="space-y-1">
            <PDFInfoRow label="Project" value={sale.project_name} />
            <PDFInfoRow label="Unit" value={sale.product_name + (sale.unit_no ? ` (${sale.unit_no})` : '')} />
            {sale.floor_no && (
              <PDFInfoRow label="Floor" value={sale.floor_no} />
            )}
            <PDFInfoRow label="Booking No" value={sale.sale_no} />
          </div>
        </PDFSection>
      </div>

      {/* Summary */}
      <PDFSection title="Payment Summary">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-600">Total Amount</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(sale.net_price, currencySymbol)}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-600">Total Paid</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(totalPaid, currencySymbol)}</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">Balance Due</p>
            <p className="text-xl font-bold text-red-800">{formatCurrency(totalDue, currencySymbol)}</p>
          </div>
        </div>
      </PDFSection>

      {/* Payment Schedule Table */}
      <PDFSection title="Installment Schedule">
        <PDFTable
          headers={['#', 'Description', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status']}
          rows={schedules.map((schedule, index) => ({
            no: (index + 1).toString(),
            description: getScheduleTypeName(schedule.schedule_type, schedule.installment_no),
            dueDate: formatDateForPDF(schedule.due_date),
            amount: formatCurrency(schedule.amount, currencySymbol),
            paid: formatCurrency(schedule.paid_amount, currencySymbol),
            balance: formatCurrency(schedule.amount - schedule.paid_amount, currencySymbol),
            status: getStatusBadge(schedule.status)
          }))}
          columns={['no', 'description', 'dueDate', 'amount', 'paid', 'balance', 'status']}
          footerRow={{
            no: '',
            description: 'TOTAL',
            dueDate: '',
            amount: formatCurrency(totalAmount, currencySymbol),
            paid: formatCurrency(totalPaid, currencySymbol),
            balance: formatCurrency(totalDue, currencySymbol),
            status: ''
          }}
        />
      </PDFSection>

      {/* Important Notes */}
      <PDFSection title="Important Notes">
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Payment should be made on or before the due date.</li>
          <li>Late payment may attract penalty as per the agreement.</li>
          <li>Payments can be made via Cash, Cheque, or Bank Transfer.</li>
          <li>Please mention Booking No ({sale.sale_no}) in all payments.</li>
          <li>For any queries, please contact our sales office.</li>
        </ul>
      </PDFSection>

      {sale.expected_handover_date && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded">
          <p className="text-sm text-blue-800">
            <strong>Expected Handover Date:</strong> {formatDateForPDF(sale.expected_handover_date)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            * Subject to timely payment and construction progress.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>This is a system-generated payment schedule as of {formatDateForPDF(new Date().toISOString())}.</p>
      </div>
    </PDFTemplate>
  )
}
