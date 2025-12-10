'use client'

import React from 'react'
import { PDFTemplate, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface BalanceSheetAccount {
  head_name: string
  balance: number
}

interface BalanceSheetPDFProps {
  asOfDate: string
  assets: {
    currentAssets: BalanceSheetAccount[]
    fixedAssets: BalanceSheetAccount[]
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: BalanceSheetAccount[]
    longTermLiabilities: BalanceSheetAccount[]
    totalLiabilities: number
  }
  equity: {
    capital: number
    retainedEarnings: number
    currentYearProfit: number
    totalEquity: number
  }
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function BalanceSheetPDF({
  asOfDate,
  assets,
  liabilities,
  equity,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: BalanceSheetPDFProps) {
  const totalLiabilitiesAndEquity = liabilities.totalLiabilities + equity.totalEquity
  const isBalanced = Math.abs(assets.totalAssets - totalLiabilitiesAndEquity) < 0.01

  return (
    <PDFTemplate
      title="BALANCE SHEET"
      documentNumber={`As of ${formatDateForPDF(asOfDate)}`}
      date={formatDateForPDF(new Date().toISOString())}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Statement Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
          <PDFInfoRow label="Reporting Date" value={formatDateForPDF(asOfDate)} />
          <PDFInfoRow label="Status" value={isBalanced ? "Balanced ✓" : "Not Balanced ✗"} />
        </div>
      </PDFSection>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT SIDE - ASSETS */}
        <div>
          <PDFSection title="ASSETS">
            <div className="border-2 border-gray-800 rounded">
              <table className="w-full border-collapse text-sm">
                {/* Current Assets */}
                <thead>
                  <tr className="bg-blue-100 border-b border-gray-400">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold">
                      Current Assets
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assets.currentAssets.map((account, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-4 py-2 pl-6">{account.head_name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(account.balance, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 border-b-2 border-gray-600 font-semibold">
                    <td className="px-4 py-2 text-right">Total Current Assets:</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(
                        assets.currentAssets.reduce((sum, a) => sum + a.balance, 0),
                        currencySymbol
                      )}
                    </td>
                  </tr>
                </tbody>

                {/* Fixed Assets */}
                <thead>
                  <tr className="bg-blue-100 border-b border-gray-400">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold">
                      Fixed Assets
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assets.fixedAssets.map((account, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-4 py-2 pl-6">{account.head_name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(account.balance, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 border-b-2 border-gray-600 font-semibold">
                    <td className="px-4 py-2 text-right">Total Fixed Assets:</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(
                        assets.fixedAssets.reduce((sum, a) => sum + a.balance, 0),
                        currencySymbol
                      )}
                    </td>
                  </tr>
                </tbody>

                {/* Total Assets */}
                <tfoot>
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="px-4 py-3 text-right">TOTAL ASSETS:</td>
                    <td className="px-4 py-3 text-right text-base">
                      {formatCurrency(assets.totalAssets, currencySymbol)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PDFSection>
        </div>

        {/* RIGHT SIDE - LIABILITIES & EQUITY */}
        <div>
          <PDFSection title="LIABILITIES & EQUITY">
            <div className="border-2 border-gray-800 rounded">
              <table className="w-full border-collapse text-sm">
                {/* Current Liabilities */}
                <thead>
                  <tr className="bg-red-100 border-b border-gray-400">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold">
                      Current Liabilities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.currentLiabilities.map((account, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-4 py-2 pl-6">{account.head_name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(account.balance, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 border-b-2 border-gray-600 font-semibold">
                    <td className="px-4 py-2 text-right">Total Current Liabilities:</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(
                        liabilities.currentLiabilities.reduce((sum, a) => sum + a.balance, 0),
                        currencySymbol
                      )}
                    </td>
                  </tr>
                </tbody>

                {/* Long-term Liabilities */}
                <thead>
                  <tr className="bg-red-100 border-b border-gray-400">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold">
                      Long-term Liabilities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.longTermLiabilities.map((account, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-4 py-2 pl-6">{account.head_name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(account.balance, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 border-b-2 border-gray-600 font-semibold">
                    <td className="px-4 py-2 text-right">Total Long-term Liabilities:</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(
                        liabilities.longTermLiabilities.reduce((sum, a) => sum + a.balance, 0),
                        currencySymbol
                      )}
                    </td>
                  </tr>
                </tbody>

                {/* Equity */}
                <thead>
                  <tr className="bg-green-100 border-b border-gray-400">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold">
                      Owner's Equity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 pl-6">Capital</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(equity.capital, currencySymbol)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 pl-6">Retained Earnings</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(equity.retainedEarnings, currencySymbol)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 pl-6">Current Year Profit/Loss</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(equity.currentYearProfit, currencySymbol)}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 border-b-2 border-gray-600 font-semibold">
                    <td className="px-4 py-2 text-right">Total Equity:</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(equity.totalEquity, currencySymbol)}
                    </td>
                  </tr>
                </tbody>

                {/* Total Liabilities & Equity */}
                <tfoot>
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="px-4 py-3 text-right">TOTAL LIABILITIES & EQUITY:</td>
                    <td className="px-4 py-3 text-right text-base">
                      {formatCurrency(totalLiabilitiesAndEquity, currencySymbol)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PDFSection>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`mt-6 border-2 rounded p-4 ${isBalanced ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
        <h4 className="font-bold text-lg mb-3 text-center">
          {isBalanced ? '✓ Balance Sheet is Balanced' : '✗ Balance Sheet is Not Balanced'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Assets</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(assets.totalAssets, currencySymbol)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Liabilities + Equity</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(totalLiabilitiesAndEquity, currencySymbol)}
            </p>
          </div>
        </div>
        {!isBalanced && (
          <div className="mt-4 pt-4 border-t-2 border-red-400 text-center">
            <p className="text-sm text-red-700 font-semibold">
              ⚠️ Difference: {formatCurrency(Math.abs(assets.totalAssets - totalLiabilitiesAndEquity), currencySymbol)}
            </p>
          </div>
        )}
      </div>

      {/* Accounting Equation */}
      <div className="mt-6 bg-blue-50 border border-blue-300 rounded p-4 text-center">
        <p className="text-lg font-semibold text-gray-800">
          Assets = Liabilities + Owner's Equity
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {formatCurrency(assets.totalAssets, currencySymbol)} = {formatCurrency(liabilities.totalLiabilities, currencySymbol)} + {formatCurrency(equity.totalEquity, currencySymbol)}
        </p>
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
