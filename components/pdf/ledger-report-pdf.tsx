'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface LedgerEntry {
  date: string
  voucher_no: string
  voucher_type: string
  particulars: string
  debit: number
  credit: number
  balance: number
}

interface LedgerReportPDFProps {
  expenseHead: {
    head_name: string
    head_type: string
  }
  entries: LedgerEntry[]
  fromDate: string
  toDate: string
  openingBalance: number
  closingBalance: number
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function LedgerReportPDF({
  expenseHead,
  entries,
  fromDate,
  toDate,
  openingBalance,
  closingBalance,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: LedgerReportPDFProps) {
  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0)

  return (
    <PDFTemplate
      title="LEDGER REPORT"
      documentNumber={`Account: ${expenseHead.head_name}`}
      date={`Period: ${formatDateForPDF(fromDate)} to ${formatDateForPDF(toDate)}`}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Account Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <PDFInfoRow label="Account Name" value={expenseHead.head_name} />
          <PDFInfoRow label="Account Type" value={expenseHead.head_type} />
          <PDFInfoRow label="Period From" value={formatDateForPDF(fromDate)} />
          <PDFInfoRow label="Period To" value={formatDateForPDF(toDate)} />
          <PDFInfoRow label="Opening Balance" value={formatCurrency(openingBalance, currencySymbol)} />
        </div>
      </PDFSection>

      <PDFSection title="Transaction Details">
        <div className="border-2 border-gray-800 rounded">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-gray-800">
                <th className="border-r border-gray-400 px-3 py-2 text-left font-bold">Date</th>
                <th className="border-r border-gray-400 px-3 py-2 text-left font-bold">Voucher No</th>
                <th className="border-r border-gray-400 px-3 py-2 text-left font-bold">Type</th>
                <th className="border-r border-gray-400 px-3 py-2 text-left font-bold">Particulars</th>
                <th className="border-r border-gray-400 px-3 py-2 text-right font-bold">Debit</th>
                <th className="border-r border-gray-400 px-3 py-2 text-right font-bold">Credit</th>
                <th className="px-3 py-2 text-right font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row */}
              <tr className="bg-blue-50 border-b border-gray-300">
                <td colSpan={4} className="border-r border-gray-400 px-3 py-2 font-semibold">
                  Opening Balance
                </td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">-</td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">-</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(openingBalance, currencySymbol)}
                </td>
              </tr>

              {/* Transaction Rows */}
              {entries.map((entry, index) => (
                <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="border-r border-gray-400 px-3 py-2">
                    {formatDateForPDF(entry.date)}
                  </td>
                  <td className="border-r border-gray-400 px-3 py-2 font-medium">
                    {entry.voucher_no}
                  </td>
                  <td className="border-r border-gray-400 px-3 py-2">
                    {entry.voucher_type}
                  </td>
                  <td className="border-r border-gray-400 px-3 py-2">
                    {entry.particulars}
                  </td>
                  <td className="border-r border-gray-400 px-3 py-2 text-right">
                    {entry.debit > 0 ? formatCurrency(entry.debit, currencySymbol) : '-'}
                  </td>
                  <td className="border-r border-gray-400 px-3 py-2 text-right">
                    {entry.credit > 0 ? formatCurrency(entry.credit, currencySymbol) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCurrency(entry.balance, currencySymbol)}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-100 border-t-2 border-gray-800 font-bold">
                <td colSpan={4} className="border-r border-gray-400 px-3 py-2">
                  Total Transactions
                </td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">
                  {formatCurrency(totalDebit, currencySymbol)}
                </td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">
                  {formatCurrency(totalCredit, currencySymbol)}
                </td>
                <td className="px-3 py-2 text-right">-</td>
              </tr>

              {/* Closing Balance Row */}
              <tr className="bg-blue-100 border-t-2 border-gray-800 font-bold">
                <td colSpan={4} className="border-r border-gray-400 px-3 py-2">
                  Closing Balance
                </td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">-</td>
                <td className="border-r border-gray-400 px-3 py-2 text-right">-</td>
                <td className="px-3 py-2 text-right text-lg">
                  {formatCurrency(closingBalance, currencySymbol)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PDFSection>

      {/* Summary Box */}
      <div className="mt-6 bg-gray-50 border-2 border-gray-300 rounded p-4">
        <h4 className="font-bold text-lg mb-3 text-center">Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Debit</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(totalDebit, currencySymbol)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Credit</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(totalCredit, currencySymbol)}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-gray-400 text-center">
          <p className="text-sm text-gray-600">Net Balance</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(closingBalance, currencySymbol)}
          </p>
        </div>
      </div>

      {/* Signature Lines */}
      <div className="mt-16 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="text-sm font-bold">Prepared By</p>
            <p className="text-xs text-gray-600 mt-1">Accounts Department</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="text-sm font-bold">Verified By</p>
            <p className="text-xs text-gray-600 mt-1">Senior Accountant</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="text-sm font-bold">Approved By</p>
            <p className="text-xs text-gray-600 mt-1">Chief Financial Officer</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
