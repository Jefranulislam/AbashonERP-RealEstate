'use client'

import React from 'react'
import { PDFTemplate, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

interface TrialBalanceAccount {
  head_name: string
  head_type: string
  debit_balance: number
  credit_balance: number
}

interface TrialBalancePDFProps {
  accounts: TrialBalanceAccount[]
  asOfDate: string
  totalDebit: number
  totalCredit: number
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
}

export function TrialBalancePDF({
  accounts,
  asOfDate,
  totalDebit,
  totalCredit,
  companyName,
  companyAddress,
  currencySymbol = '৳',
}: TrialBalancePDFProps) {
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.head_type]) {
      acc[account.head_type] = []
    }
    acc[account.head_type].push(account)
    return acc
  }, {} as Record<string, TrialBalanceAccount[]>)

  return (
    <PDFTemplate
      title="TRIAL BALANCE"
      documentNumber={`As of ${formatDateForPDF(asOfDate)}`}
      date={formatDateForPDF(new Date().toISOString())}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      <PDFSection title="Statement Information">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
          <PDFInfoRow label="Report Date" value={formatDateForPDF(asOfDate)} />
          <PDFInfoRow label="Status" value={isBalanced ? "Balanced ✓" : "Not Balanced ✗"} />
        </div>
      </PDFSection>

      <PDFSection title="Account Balances">
        <div className="border-2 border-gray-800 rounded">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-gray-800">
                <th className="border-r border-gray-400 px-4 py-3 text-left font-bold w-1/2">
                  Account Name
                </th>
                <th className="border-r border-gray-400 px-4 py-3 text-center font-bold w-1/6">
                  Type
                </th>
                <th className="border-r border-gray-400 px-4 py-3 text-right font-bold w-1/6">
                  Debit Balance
                </th>
                <th className="px-4 py-3 text-right font-bold w-1/6">
                  Credit Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedAccounts).map(([type, typeAccounts], typeIndex) => (
                <React.Fragment key={type}>
                  {/* Type Header */}
                  <tr className="bg-blue-50 border-b border-gray-400">
                    <td colSpan={4} className="px-4 py-2 font-bold text-gray-800">
                      {type}
                    </td>
                  </tr>
                  
                  {/* Accounts under this type */}
                  {typeAccounts.map((account, accIndex) => (
                    <tr key={`${type}-${accIndex}`} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="border-r border-gray-400 px-4 py-2 pl-8">
                        {account.head_name}
                      </td>
                      <td className="border-r border-gray-400 px-4 py-2 text-center text-xs text-gray-600">
                        {account.head_type}
                      </td>
                      <td className="border-r border-gray-400 px-4 py-2 text-right font-medium">
                        {account.debit_balance > 0 
                          ? formatCurrency(account.debit_balance, currencySymbol)
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {account.credit_balance > 0 
                          ? formatCurrency(account.credit_balance, currencySymbol)
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal for this type */}
                  <tr className="bg-gray-100 border-b-2 border-gray-400 font-semibold">
                    <td colSpan={2} className="border-r border-gray-400 px-4 py-2 text-right">
                      Subtotal - {type}:
                    </td>
                    <td className="border-r border-gray-400 px-4 py-2 text-right">
                      {formatCurrency(
                        typeAccounts.reduce((sum, acc) => sum + acc.debit_balance, 0),
                        currencySymbol
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(
                        typeAccounts.reduce((sum, acc) => sum + acc.credit_balance, 0),
                        currencySymbol
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand Total */}
              <tr className="bg-gray-800 text-white border-t-2 border-gray-900 font-bold text-base">
                <td colSpan={2} className="border-r border-gray-600 px-4 py-3 text-right">
                  GRAND TOTAL
                </td>
                <td className="border-r border-gray-600 px-4 py-3 text-right">
                  {formatCurrency(totalDebit, currencySymbol)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(totalCredit, currencySymbol)}
                </td>
              </tr>

              {/* Difference Row (if not balanced) */}
              {!isBalanced && (
                <tr className="bg-red-100 border-t border-red-400 font-bold text-red-700">
                  <td colSpan={2} className="border-r border-red-400 px-4 py-2 text-right">
                    DIFFERENCE (Not Balanced!)
                  </td>
                  <td colSpan={2} className="px-4 py-2 text-right">
                    {formatCurrency(Math.abs(totalDebit - totalCredit), currencySymbol)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PDFSection>

      {/* Balance Status Box */}
      <div className={`mt-6 border-2 rounded p-4 ${isBalanced ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
        <h4 className="font-bold text-lg mb-3 text-center">
          {isBalanced ? '✓ Books Are Balanced' : '✗ Books Are Not Balanced'}
        </h4>
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
        {!isBalanced && (
          <div className="mt-4 pt-4 border-t-2 border-red-400 text-center">
            <p className="text-sm text-red-700 font-semibold">
              ⚠️ Warning: The difference of {formatCurrency(Math.abs(totalDebit - totalCredit), currencySymbol)} needs to be investigated.
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6 bg-blue-50 border border-blue-300 rounded p-4">
        <h4 className="font-semibold text-sm mb-2">Notes:</h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>This Trial Balance shows the balance of all active accounts as of the specified date.</li>
          <li>Debit balances are shown in the Debit column, Credit balances in the Credit column.</li>
          <li>Total Debit must equal Total Credit for books to be in balance.</li>
          <li>Any difference indicates posting errors that need correction.</li>
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
            <p className="text-xs text-gray-600 mt-1">Chief Financial Officer</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
