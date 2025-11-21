'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface VoucherEntry {
  ledger_name: string
  head_type: string
  debit: number
  credit: number
  narration?: string
}

interface AccountingVoucherPDFProps {
  voucher: {
    voucher_no: string
    voucher_date: string
    voucher_type: 'debit' | 'credit' | 'contra' | 'journal'
    total_amount: number
    narration?: string
    created_by?: string
  }
  entries: VoucherEntry[]
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function AccountingVoucherPDF({
  voucher,
  entries,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: AccountingVoucherPDFProps) {
  const voucherTypeTitle = {
    debit: 'Debit Voucher',
    credit: 'Credit Voucher',
    contra: 'Contra Voucher',
    journal: 'Journal Voucher',
  }[voucher.voucher_type]

  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0)

  return (
    <PDFTemplate
      title={voucherTypeTitle}
      documentNumber={voucher.voucher_no}
      date={formatDateForPDF(voucher.voucher_date)}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Voucher Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <PDFInfoRow label="Voucher No" value={voucher.voucher_no} />
          <PDFInfoRow label="Voucher Date" value={formatDateForPDF(voucher.voucher_date)} />
          <PDFInfoRow label="Voucher Type" value={voucherTypeTitle} />
          <PDFInfoRow label="Total Amount" value={formatCurrency(voucher.total_amount, currencySymbol)} />
        </div>
        {voucher.narration && (
          <div className="mt-4">
            <PDFInfoRow label="Narration" value={voucher.narration} />
          </div>
        )}
      </PDFSection>

      <PDFSection title="Entries">
        <PDFTable
          headers={['Ledger / Account Head', 'Type', 'Debit', 'Credit', 'Narration']}
          rows={entries.map((entry) => ({
            ledger: entry.ledger_name,
            type: entry.head_type,
            debit: entry.debit > 0 ? formatCurrency(entry.debit, currencySymbol) : '-',
            credit: entry.credit > 0 ? formatCurrency(entry.credit, currencySymbol) : '-',
            narration: entry.narration || '-',
          }))}
          columns={['ledger', 'type', 'debit', 'credit', 'narration']}
        />
        
        <div className="mt-4 border-t-2 border-gray-800 pt-2">
          <div className="flex justify-between font-bold text-base">
            <span>Total:</span>
            <div className="flex gap-8">
              <span>Debit: {formatCurrency(totalDebit, currencySymbol)}</span>
              <span>Credit: {formatCurrency(totalCredit, currencySymbol)}</span>
            </div>
          </div>
        </div>
      </PDFSection>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Prepared By</p>
            {voucher.created_by && (
              <p className="text-xs text-gray-600 mt-1">{voucher.created_by}</p>
            )}
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
