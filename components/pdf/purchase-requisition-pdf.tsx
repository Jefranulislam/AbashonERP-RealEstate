'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface RequisitionItem {
  expense_head_name: string
  description: string
  qty: number
  rate: number
  total_price: number
}

interface PurchaseRequisitionPDFProps {
  requisition: {
    mpr_no: string
    requisition_date: string
    required_date?: string
    project_name: string
    employee_name: string
    purpose_description?: string
    contact_person?: string
    comments?: string
    nb?: string
    remark?: string
    total_amount: number
  }
  items: RequisitionItem[]
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function PurchaseRequisitionPDF({
  requisition,
  items,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: PurchaseRequisitionPDFProps) {
  return (
    <PDFTemplate
      title="Purchase Requisition"
      documentNumber={requisition.mpr_no}
      date={formatDateForPDF(requisition.requisition_date)}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Requisition Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <PDFInfoRow label="MPR No" value={requisition.mpr_no} />
          <PDFInfoRow label="Requisition Date" value={formatDateForPDF(requisition.requisition_date)} />
          <PDFInfoRow label="Project" value={requisition.project_name} />
          <PDFInfoRow label="Requested By" value={requisition.employee_name} />
          {requisition.required_date && (
            <PDFInfoRow label="Required Date" value={formatDateForPDF(requisition.required_date)} />
          )}
          {requisition.contact_person && (
            <PDFInfoRow label="Contact Person" value={requisition.contact_person} />
          )}
        </div>
        {requisition.purpose_description && (
          <div className="mt-4">
            <PDFInfoRow label="Purpose" value={requisition.purpose_description} />
          </div>
        )}
        {requisition.comments && (
          <div className="mt-2">
            <PDFInfoRow label="Comments" value={requisition.comments} />
          </div>
        )}
      </PDFSection>

      <PDFSection title="Items">
        <PDFTable
          headers={['#', 'Expense Head', 'Description', 'Qty', 'Rate', 'Total']}
          rows={items.map((item, index) => ({
            no: (index + 1).toString(),
            expenseHead: item.expense_head_name,
            description: item.description,
            qty: item.qty.toString(),
            rate: formatCurrency(item.rate, currencySymbol),
            total: formatCurrency(item.total_price, currencySymbol),
          }))}
          columns={['no', 'expenseHead', 'description', 'qty', 'rate', 'total']}
          footerRow={{
            label: 'Total Amount',
            colspan: 5,
            value: formatCurrency(requisition.total_amount, currencySymbol),
          }}
        />
      </PDFSection>

      {(requisition.nb || requisition.remark) && (
        <PDFSection title="Additional Notes">
          {requisition.nb && <PDFInfoRow label="NB" value={requisition.nb} />}
          {requisition.remark && <PDFInfoRow label="Remark" value={requisition.remark} />}
        </PDFSection>
      )}

      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Prepared By</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Verified By</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Approved By</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
