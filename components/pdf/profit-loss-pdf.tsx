'use client'

import React from 'react'
import { PDFTemplate, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface PLAccount {
  head_name: string
  amount: number
}

interface ProfitLossPDFProps {
  fromDate: string
  toDate: string
  revenue: {
    accounts: PLAccount[]
    total: number
  }
  expenses: {
    directExpenses: PLAccount[]
    operatingExpenses: PLAccount[]
    otherExpenses: PLAccount[]
    total: number
  }
  grossProfit: number
  operatingProfit: number
  netProfit: number
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function ProfitLossPDF({
  fromDate,
  toDate,
  revenue,
  expenses,
  grossProfit,
  operatingProfit,
  netProfit,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: ProfitLossPDFProps) {
  const isProfitable = netProfit >= 0
  const profitMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0

  return (
    <PDFTemplate
      title="PROFIT & LOSS STATEMENT"
      documentNumber={`Period: ${formatDateForPDF(fromDate)} to ${formatDateForPDF(toDate)}`}
      date={formatDateForPDF(new Date().toISOString())}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Statement Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
          <PDFInfoRow label="Period From" value={formatDateForPDF(fromDate)} />
          <PDFInfoRow label="Period To" value={formatDateForPDF(toDate)} />
          <PDFInfoRow label="Result" value={isProfitable ? "Profit ✓" : "Loss ✗"} />
          <PDFInfoRow label="Profit Margin" value={`${profitMargin.toFixed(2)}%`} />
        </div>
      </PDFSection>

      <div className="border-2 border-gray-800 rounded">
        <table className="w-full border-collapse text-sm">
          {/* REVENUE SECTION */}
          <thead>
            <tr className="bg-green-100 border-b-2 border-gray-600">
              <th colSpan={2} className="px-4 py-3 text-left font-bold text-base">
                REVENUE
              </th>
            </tr>
          </thead>
          <tbody>
            {revenue.accounts.map((account, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="px-4 py-2 pl-8">{account.head_name}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCurrency(account.amount, currencySymbol)}
                </td>
              </tr>
            ))}
            <tr className="bg-green-200 border-b-2 border-gray-600 font-bold">
              <td className="px-4 py-3 text-right">Total Revenue:</td>
              <td className="px-4 py-3 text-right text-base">
                {formatCurrency(revenue.total, currencySymbol)}
              </td>
            </tr>
          </tbody>

          {/* EXPENSES SECTION */}
          <thead>
            <tr className="bg-red-100 border-b border-gray-400">
              <th colSpan={2} className="px-4 py-3 text-left font-bold text-base">
                EXPENSES
              </th>
            </tr>
          </thead>

          {/* Direct Expenses (Cost of Goods Sold) */}
          {expenses.directExpenses.length > 0 && (
            <>
              <thead>
                <tr className="bg-orange-50 border-b border-gray-300">
                  <th colSpan={2} className="px-4 py-2 text-left font-semibold pl-6">
                    Cost of Goods Sold / Direct Expenses
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.directExpenses.map((account, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-2 pl-10">{account.head_name}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(account.amount, currencySymbol)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 border-b border-gray-400 font-semibold">
                  <td className="px-4 py-2 text-right">Subtotal - Direct Expenses:</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(
                      expenses.directExpenses.reduce((sum, a) => sum + a.amount, 0),
                      currencySymbol
                    )}
                  </td>
                </tr>
              </tbody>
            </>
          )}

          {/* Gross Profit */}
          <tbody>
            <tr className="bg-blue-100 border-y-2 border-blue-600 font-bold text-blue-900">
              <td className="px-4 py-3 text-right">GROSS PROFIT:</td>
              <td className="px-4 py-3 text-right text-base">
                {formatCurrency(grossProfit, currencySymbol)}
              </td>
            </tr>
          </tbody>

          {/* Operating Expenses */}
          {expenses.operatingExpenses.length > 0 && (
            <>
              <thead>
                <tr className="bg-orange-50 border-b border-gray-300">
                  <th colSpan={2} className="px-4 py-2 text-left font-semibold pl-6">
                    Operating Expenses
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.operatingExpenses.map((account, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-2 pl-10">{account.head_name}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(account.amount, currencySymbol)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 border-b border-gray-400 font-semibold">
                  <td className="px-4 py-2 text-right">Subtotal - Operating Expenses:</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(
                      expenses.operatingExpenses.reduce((sum, a) => sum + a.amount, 0),
                      currencySymbol
                    )}
                  </td>
                </tr>
              </tbody>
            </>
          )}

          {/* Operating Profit */}
          <tbody>
            <tr className="bg-purple-100 border-y-2 border-purple-600 font-bold text-purple-900">
              <td className="px-4 py-3 text-right">OPERATING PROFIT:</td>
              <td className="px-4 py-3 text-right text-base">
                {formatCurrency(operatingProfit, currencySymbol)}
              </td>
            </tr>
          </tbody>

          {/* Other Expenses */}
          {expenses.otherExpenses.length > 0 && (
            <>
              <thead>
                <tr className="bg-orange-50 border-b border-gray-300">
                  <th colSpan={2} className="px-4 py-2 text-left font-semibold pl-6">
                    Other Expenses
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.otherExpenses.map((account, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-2 pl-10">{account.head_name}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(account.amount, currencySymbol)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 border-b border-gray-400 font-semibold">
                  <td className="px-4 py-2 text-right">Subtotal - Other Expenses:</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(
                      expenses.otherExpenses.reduce((sum, a) => sum + a.amount, 0),
                      currencySymbol
                    )}
                  </td>
                </tr>
              </tbody>
            </>
          )}

          {/* Total Expenses */}
          <tbody>
            <tr className="bg-red-200 border-b-2 border-gray-600 font-bold">
              <td className="px-4 py-3 text-right">Total Expenses:</td>
              <td className="px-4 py-3 text-right text-base">
                {formatCurrency(expenses.total, currencySymbol)}
              </td>
            </tr>
          </tbody>

          {/* NET PROFIT/LOSS */}
          <tfoot>
            <tr className={`${isProfitable ? 'bg-green-600' : 'bg-red-600'} text-white font-bold border-t-4 border-gray-900`}>
              <td className="px-4 py-4 text-right text-lg">
                NET {isProfitable ? 'PROFIT' : 'LOSS'}:
              </td>
              <td className="px-4 py-4 text-right text-xl">
                {formatCurrency(Math.abs(netProfit), currencySymbol)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Financial Metrics */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-300 rounded p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(revenue.total, currencySymbol)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-300 rounded p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
          <p className="text-lg font-bold text-red-700">
            {formatCurrency(expenses.total, currencySymbol)}
          </p>
        </div>
        <div className={`${isProfitable ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'} border rounded p-4 text-center`}>
          <p className="text-xs text-gray-600 mb-1">Net Result</p>
          <p className={`text-lg font-bold ${isProfitable ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(Math.abs(netProfit), currencySymbol)}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-300 rounded p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Profit Margin</p>
          <p className="text-lg font-bold text-purple-700">
            {profitMargin.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="mt-6 bg-blue-50 border border-blue-300 rounded p-4 text-center">
        <p className="text-lg font-semibold text-gray-800">
          Net Profit = Total Revenue - Total Expenses
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {formatCurrency(Math.abs(netProfit), currencySymbol)} = {formatCurrency(revenue.total, currencySymbol)} - {formatCurrency(expenses.total, currencySymbol)}
        </p>
      </div>

      {/* Notes */}
      <div className="mt-6 bg-gray-50 border border-gray-300 rounded p-4">
        <h4 className="font-semibold text-sm mb-2">Notes:</h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>This Profit & Loss Statement shows the financial performance for the specified period.</li>
          <li>Gross Profit = Revenue - Direct Expenses (Cost of Goods Sold)</li>
          <li>Operating Profit = Gross Profit - Operating Expenses</li>
          <li>Net Profit = Operating Profit - Other Expenses</li>
          <li>Profit Margin = (Net Profit / Total Revenue) × 100</li>
        </ul>
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
            <p className="text-sm font-bold">Reviewed By</p>
            <p className="text-xs text-gray-600 mt-1">Senior Accountant</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="text-sm font-bold">Approved By</p>
            <p className="text-xs text-gray-600 mt-1">Managing Director</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
