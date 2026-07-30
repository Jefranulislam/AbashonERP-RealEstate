'use client'

import React from 'react'
import { PDFTemplate, PDFTable, PDFSection, PDFInfoRow } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

/**
 * A single line in the payment-details table of a client-facing voucher receipt.
 */
export interface VoucherReceiptRow {
  description?: string
  bank?: string
  chequeNo?: string
  chequeDate?: string
  reference?: string
  amount: number
}

/**
 * Normalized, presentation-ready shape for a client-facing voucher/receipt.
 * Every accounting module (Credit, Debit, Payment Transaction) maps its raw
 * record into this shape so a single professional layout is reused everywhere.
 *
 * This is intentionally NOT an accounting ledger — no debit/credit columns.
 */
export interface VoucherReceiptData {
  documentTitle: string // e.g. "Credit Voucher", "Debit Voucher", "Payment Voucher"
  // Voucher information
  voucherNo?: string
  voucherDate?: string
  voucherType?: string
  status?: string
  // Customer / Vendor information
  partyLabel?: string // "Customer" or "Vendor"
  partyName?: string
  partyCode?: string
  partyContactPerson?: string
  partyAddress?: string
  partyPhone?: string
  partyEmail?: string
  // Payment information
  paymentMethod?: string
  bankName?: string
  chequeNo?: string
  chequeDate?: string
  referenceNumber?: string
  transactionId?: string
  // Purchase Order reference (vendor payments)
  poNumber?: string
  // Description
  purpose?: string
  narration?: string
  // Accounting — pre-formatted as "CODE - Name" when the code is known
  headOfAccount?: string
  // Financial
  tax?: number
  discount?: number
  totalAmount: number
  // Payment details table (all partial payments when paid in several tranches)
  rows?: VoucherReceiptRow[]
  // Footer / signatures
  preparedBy?: string
  approvedBy?: string
  receivedBy?: string
}

interface VoucherReceiptPDFProps {
  data: VoucherReceiptData
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  currencySymbol?: string
  companyLogo?: string
  footerImage?: string
  backgroundImage?: string
}

/** True when a value is worth printing (skips null/undefined/empty/whitespace). */
function has(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

export function VoucherReceiptPDF({
  data,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  currencySymbol = '৳',
  companyLogo,
  footerImage,
  backgroundImage,
}: VoucherReceiptPDFProps) {
  const money = (n: number) => formatCurrency(Number(n) || 0, currencySymbol)

  // Voucher information (left/right pairs, only the ones we have)
  const voucherInfo: Array<[string, string]> = []
  if (has(data.voucherNo)) voucherInfo.push(['Voucher No', String(data.voucherNo)])
  if (has(data.voucherDate)) voucherInfo.push(['Voucher Date', formatDateForPDF(data.voucherDate as string)])
  if (has(data.voucherType)) voucherInfo.push(['Voucher Type', String(data.voucherType)])
  if (has(data.status)) voucherInfo.push(['Status', String(data.status)])
  // PO reference: show the number when linked; vendor payments show N/A otherwise.
  if (has(data.poNumber)) voucherInfo.push(['PO Number', String(data.poNumber)])
  else if ((data.partyLabel || '').toLowerCase() === 'vendor') voucherInfo.push(['PO Number', 'N/A'])

  // Party information
  const partyInfo: Array<[string, string]> = []
  if (has(data.partyName)) partyInfo.push([`${data.partyLabel || 'Party'} Name`, String(data.partyName)])
  if (has(data.partyCode)) partyInfo.push([`${data.partyLabel || 'Party'} ID`, String(data.partyCode)])
  if (has(data.partyContactPerson)) partyInfo.push(['Contact Person', String(data.partyContactPerson)])
  if (has(data.partyPhone)) partyInfo.push(['Phone', String(data.partyPhone)])
  if (has(data.partyAddress)) partyInfo.push(['Address', String(data.partyAddress)])
  if (has(data.partyEmail)) partyInfo.push(['Email', String(data.partyEmail)])

  // Payment information
  const paymentInfo: Array<[string, string]> = []
  if (has(data.paymentMethod)) paymentInfo.push(['Payment Method', String(data.paymentMethod)])
  if (has(data.bankName)) paymentInfo.push(['Bank / Account', String(data.bankName)])
  if (has(data.chequeNo)) paymentInfo.push(['Cheque No', String(data.chequeNo)])
  if (has(data.chequeDate)) paymentInfo.push(['Cheque Date', formatDateForPDF(data.chequeDate as string)])
  if (has(data.referenceNumber)) paymentInfo.push(['Reference Number', String(data.referenceNumber)])
  if (has(data.transactionId)) paymentInfo.push(['Transaction ID', String(data.transactionId)])
  if (has(data.headOfAccount)) paymentInfo.push(['Head of Account', String(data.headOfAccount)])

  const rows = (data.rows && data.rows.length > 0
    ? data.rows
    : [{ description: data.purpose || data.narration || '-', bank: data.bankName, chequeNo: data.chequeNo, chequeDate: data.chequeDate, reference: data.referenceNumber, amount: data.totalAmount }])

  const renderPairs = (pairs: Array<[string, string]>) => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
      {pairs.map(([label, value], i) => (
        <PDFInfoRow key={i} label={label} value={value} labelWidth="130px" />
      ))}
    </div>
  )

  return (
    <PDFTemplate
      title={data.documentTitle}
      documentNumber={data.voucherNo}
      date={data.voucherDate ? formatDateForPDF(data.voucherDate) : undefined}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyLogo={companyLogo}
      footerImage={footerImage}
      backgroundImage={backgroundImage}
    >
      {voucherInfo.length > 0 && (
        <PDFSection title="Voucher Information" titleSize="small" spacing="compact">
          {renderPairs(voucherInfo)}
        </PDFSection>
      )}

      {partyInfo.length > 0 && (
        <PDFSection title={`${data.partyLabel || 'Customer'} Information`} titleSize="small" spacing="compact">
          {renderPairs(partyInfo)}
        </PDFSection>
      )}

      {paymentInfo.length > 0 && (
        <PDFSection title="Payment Information" titleSize="small" spacing="compact">
          {renderPairs(paymentInfo)}
        </PDFSection>
      )}

      {(has(data.purpose) || has(data.narration)) && (
        <PDFSection title="Description" titleSize="small" spacing="compact">
          {has(data.purpose) && <PDFInfoRow label="Purpose" value={String(data.purpose)} labelWidth="130px" />}
          {has(data.narration) && <PDFInfoRow label="Narration" value={String(data.narration)} labelWidth="130px" />}
        </PDFSection>
      )}

      <PDFSection title="Payment Details" titleSize="small" spacing="compact">
        <PDFTable
          headers={['Description', 'Bank', 'Cheque No', 'Cheque Date', 'Reference', 'Amount']}
          rows={rows.map((r) => ({
            description: has(r.description) ? r.description : '-',
            bank: has(r.bank) ? r.bank : '-',
            chequeNo: has(r.chequeNo) ? r.chequeNo : '-',
            chequeDate: has(r.chequeDate) ? formatDateForPDF(r.chequeDate as string) : '-',
            reference: has(r.reference) ? r.reference : '-',
            amount: money(r.amount),
          }))}
          columns={['description', 'bank', 'chequeNo', 'chequeDate', 'reference', 'amount']}
          footerRow={{ label: 'Total', colspan: 5, value: money(data.totalAmount) }}
        />
      </PDFSection>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Prepared By</p>
            {has(data.preparedBy) && <p className="text-xs text-gray-600 mt-1">{data.preparedBy}</p>}
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Approved By</p>
            {has(data.approvedBy) && <p className="text-xs text-gray-600 mt-1">{data.approvedBy}</p>}
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="text-sm font-medium">Received By</p>
            {has(data.receivedBy) && <p className="text-xs text-gray-600 mt-1">{data.receivedBy}</p>}
          </div>
        </div>
      </div>
    </PDFTemplate>
  )
}
