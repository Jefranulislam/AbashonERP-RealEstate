"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDateDMY } from "@/lib/utils"

export interface VoucherViewData {
  title?: string
  // Voucher information
  voucherNo?: string
  date?: string
  voucherType?: string
  status?: string
  project?: string
  billNo?: string
  // Customer / Vendor
  partyLabel?: string
  partyName?: string
  partyCode?: string
  partyAddress?: string
  partyPhone?: string
  partyEmail?: string
  // Payment details
  paymentMethod?: string
  bankName?: string
  chequeNo?: string
  chequeDate?: string
  referenceNumber?: string
  transactionId?: string
  // Accounting
  headOfAccount?: string
  description?: string
  narration?: string
  // Financial
  amount?: number
  tax?: number
  discount?: number
  // People
  preparedBy?: string
  verifiedBy?: string
}

function has(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== ""
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2 border-b pb-1">{title}</h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

interface VoucherViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: VoucherViewData | null
  currencySymbol?: string
}

/** Shared, fully-detailed read-only voucher/payment view used across accounting modules. */
export function VoucherViewModal({ open, onOpenChange, data, currencySymbol = "৳" }: VoucherViewModalProps) {
  const money = (n?: number) =>
    `${currencySymbol} ${(Number(n) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`

  const partyLabel = data?.partyLabel || "Customer/Vendor"

  const showParty = data && (has(data.partyName) || has(data.partyCode) || has(data.partyAddress) || has(data.partyPhone) || has(data.partyEmail))
  const showPayment = data && (has(data.paymentMethod) || has(data.bankName) || has(data.chequeNo) || has(data.chequeDate) || has(data.referenceNumber) || has(data.transactionId))
  const showAccounting = data && (has(data.headOfAccount) || has(data.description) || has(data.narration))
  const showFinancial = data && (has(data.amount) || has(data.tax) || has(data.discount))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.title || "Voucher Details"}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-5">
            <Section title="Voucher Information">
              {has(data.voucherNo) && <Field label="Voucher No" value={data.voucherNo} />}
              {has(data.date) && <Field label="Date" value={formatDateDMY(data.date as string)} />}
              {has(data.voucherType) && <Field label="Voucher Type" value={data.voucherType} />}
              {has(data.status) && <Field label="Status" value={<Badge variant="outline">{data.status}</Badge>} />}
              {has(data.project) && <Field label="Project" value={data.project} />}
              {has(data.billNo) && <Field label="Bill / M.R No" value={data.billNo} />}
            </Section>

            {showParty && (
              <Section title={`${partyLabel} Information`}>
                {has(data.partyName) && <Field label="Name" value={data.partyName} />}
                {has(data.partyCode) && <Field label="Code" value={data.partyCode} />}
                {has(data.partyAddress) && <Field label="Address" value={data.partyAddress} />}
                {has(data.partyPhone) && <Field label="Phone" value={data.partyPhone} />}
                {has(data.partyEmail) && <Field label="Email" value={data.partyEmail} />}
              </Section>
            )}

            {showPayment && (
              <Section title="Payment Details">
                {has(data.paymentMethod) && <Field label="Payment Method" value={data.paymentMethod} />}
                {has(data.bankName) && <Field label="Bank Name" value={data.bankName} />}
                {has(data.chequeNo) && <Field label="Cheque Number" value={data.chequeNo} />}
                {has(data.chequeDate) && <Field label="Cheque Date" value={formatDateDMY(data.chequeDate as string)} />}
                {has(data.referenceNumber) && <Field label="Reference Number" value={data.referenceNumber} />}
                {has(data.transactionId) && <Field label="Transaction ID" value={data.transactionId} />}
              </Section>
            )}

            {showAccounting && (
              <Section title="Accounting Information">
                {has(data.headOfAccount) && <Field label="Head of Account" value={data.headOfAccount} />}
                {has(data.description) && <Field label="Description" value={data.description} />}
                {has(data.narration) && <Field label="Narration" value={data.narration} />}
              </Section>
            )}

            {showFinancial && (
              <Section title="Financial Information">
                {has(data.discount) && Number(data.discount) !== 0 && <Field label="Discount" value={money(data.discount)} />}
                {has(data.tax) && Number(data.tax) !== 0 && <Field label="Tax" value={money(data.tax)} />}
                {has(data.amount) && (
                  <Field label="Amount" value={<span className="text-lg font-bold">{money(data.amount)}</span>} />
                )}
              </Section>
            )}

            {(has(data.preparedBy) || has(data.verifiedBy)) && (
              <Section title="Authorization">
                {has(data.preparedBy) && <Field label="Prepared By" value={data.preparedBy} />}
                {has(data.verifiedBy) && <Field label="Verified By" value={data.verifiedBy} />}
              </Section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
