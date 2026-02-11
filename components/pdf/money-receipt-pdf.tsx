'use client'

import React from 'react'
import { PDFTemplate, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

// Number to words conversion for amount in words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'
  if (num < 0) return 'Minus ' + numberToWords(-num)

  let words = ''

  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore '
    num %= 10000000
  }

  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh '
    num %= 100000
  }

  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand '
    num %= 1000
  }

  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + ' Hundred '
    num %= 100
  }

  if (num > 0) {
    if (words !== '') words += 'and '
    if (num < 20) {
      words += ones[num]
    } else {
      words += tens[Math.floor(num / 10)]
      if (num % 10 > 0) {
        words += '-' + ones[num % 10]
      }
    }
  }

  return words.trim()
}

interface MoneyReceiptPDFProps {
  receipt: {
    receipt_no: string
    payment_date: string
    customer_name: string
    customer_phone?: string
    customer_address?: string
    project_name: string
    product_name: string
    unit_no?: string
    floor_no?: string
    sale_no: string
    amount: number
    payment_method: string
    cheque_number?: string
    cheque_date?: string
    cheque_bank?: string
    transaction_reference?: string
    bank_account_name?: string
    remarks?: string
    received_by_name?: string
    // Totals
    net_price?: number
    total_paid?: number
    outstanding_amount?: number
  }
  companyName?: string
  companyAddress?: string
  currencySymbol?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
}

export function MoneyReceiptPDF({
  receipt,
  companyName,
  companyAddress,
  currencySymbol = '৳',
  companyLogo,
  footerImage,
  backgroundImage,
}: MoneyReceiptPDFProps) {
  const amountInWords = numberToWords(Math.floor(receipt.amount)) + ' Taka Only'

  return (
    <PDFTemplate
      title="MONEY RECEIPT"
      documentNumber={receipt.receipt_no}
      date={formatDateForPDF(receipt.payment_date)}
      companyName={companyName}
      companyAddress={companyAddress}
      companyLogo={companyLogo}
      footerImage={footerImage}
      backgroundImage={backgroundImage}
    >
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Customer Details */}
        <PDFSection title="Received From">
          <div className="space-y-1">
            <p className="font-bold text-base">{receipt.customer_name}</p>
            {receipt.customer_phone && (
              <p className="text-sm text-gray-700">Phone: {receipt.customer_phone}</p>
            )}
            {receipt.customer_address && (
              <p className="text-sm text-gray-700">Address: {receipt.customer_address}</p>
            )}
          </div>
        </PDFSection>

        {/* Receipt Details */}
        <PDFSection title="Receipt Details">
          <div className="space-y-1">
            <PDFInfoRow label="Receipt No" value={receipt.receipt_no} />
            <PDFInfoRow label="Date" value={formatDateForPDF(receipt.payment_date)} />
            <PDFInfoRow label="Booking No" value={receipt.sale_no} />
          </div>
        </PDFSection>
      </div>

      {/* Property Reference */}
      <PDFSection title="Payment For">
        <div className="grid grid-cols-2 gap-4">
          <PDFInfoRow label="Project" value={receipt.project_name} />
          <PDFInfoRow label="Unit/Flat" value={receipt.product_name + (receipt.unit_no ? ` (${receipt.unit_no})` : '')} />
          {receipt.floor_no && (
            <PDFInfoRow label="Floor" value={receipt.floor_no} />
          )}
        </div>
      </PDFSection>

      {/* Amount Details */}
      <div className="my-8 p-6 bg-gray-50 border-2 border-gray-300 rounded-lg">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 uppercase tracking-wider">Amount Received</p>
          <p className="text-4xl font-bold text-green-700 mt-2">
            {formatCurrency(receipt.amount, currencySymbol)}
          </p>
        </div>
        <div className="text-center border-t border-gray-300 pt-4">
          <p className="text-sm text-gray-600">In Words:</p>
          <p className="font-medium text-gray-800">{amountInWords}</p>
        </div>
      </div>

      {/* Payment Method Details */}
      <PDFSection title="Payment Details">
        <div className="grid grid-cols-2 gap-4">
          <PDFInfoRow label="Payment Method" value={receipt.payment_method.toUpperCase()} />
          
          {receipt.payment_method === 'cheque' && (
            <>
              {receipt.cheque_number && (
                <PDFInfoRow label="Cheque No" value={receipt.cheque_number} />
              )}
              {receipt.cheque_bank && (
                <PDFInfoRow label="Bank" value={receipt.cheque_bank} />
              )}
              {receipt.cheque_date && (
                <PDFInfoRow label="Cheque Date" value={formatDateForPDF(receipt.cheque_date)} />
              )}
            </>
          )}

          {receipt.payment_method === 'bank_transfer' && (
            <>
              {receipt.bank_account_name && (
                <PDFInfoRow label="To Account" value={receipt.bank_account_name} />
              )}
              {receipt.transaction_reference && (
                <PDFInfoRow label="Transaction Ref" value={receipt.transaction_reference} />
              )}
            </>
          )}

          {receipt.received_by_name && (
            <PDFInfoRow label="Received By" value={receipt.received_by_name} />
          )}
        </div>
      </PDFSection>

      {/* Account Summary */}
      {receipt.net_price && (
        <PDFSection title="Account Summary">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Total Price:</span>
              <span>{formatCurrency(receipt.net_price, currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
              <span>Total Paid (including this):</span>
              <span>{formatCurrency(receipt.total_paid || 0, currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Outstanding Balance:</span>
              <span className={receipt.outstanding_amount && receipt.outstanding_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(receipt.outstanding_amount || 0, currencySymbol)}
              </span>
            </div>
          </div>
        </PDFSection>
      )}

      {receipt.remarks && (
        <PDFSection title="Remarks">
          <p className="text-sm text-gray-700">{receipt.remarks}</p>
        </PDFSection>
      )}

      {/* Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
        <p><strong>Note:</strong> This is a computer-generated receipt. Please preserve this receipt for future reference. 
        Cheque payments are subject to realization.</p>
      </div>

      {/* Signatures */}
      <div className="mt-12 pt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-12">
            <p className="font-medium">Customer Signature</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-12">
            <p className="font-medium">For {companyName || 'Company'}</p>
            <p className="text-sm text-gray-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
