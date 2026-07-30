import type { VoucherViewData } from "@/components/accounting/voucher-view-modal"
import type { VoucherReceiptData, VoucherReceiptRow } from "@/components/pdf/voucher-receipt-pdf"

/** A payment record aggregated from payment_transactions for a voucher/PO. */
export interface VoucherPaymentRecord {
  payment_number?: string
  payment_date?: string
  payment_method?: string
  bank_name?: string
  cheque_number?: string
  cheque_date?: string
  reference?: string
  amount?: number | string
}

/** Raw voucher row as returned by GET /api/accounting/vouchers. */
export interface VoucherRow {
  voucher_no?: string
  voucher_type?: string
  date?: string
  is_confirmed?: boolean
  project_name?: string
  expense_head_name?: string
  expense_head_code?: string
  bank_cash_name?: string
  cheque_number?: string
  cheque_date?: string
  payment_method?: string
  bill_no?: string
  amount?: number | string
  particulars?: string
  description?: string
  memo?: string
  vendor_display_name?: string
  vendor_code?: string
  vendor_contact_person?: string
  vendor_address?: string
  vendor_phone?: string
  vendor_email?: string
  constructor_name?: string
  party_type?: string
  po_number?: string
  payment_records?: VoucherPaymentRecord[] | null
  created_by_name?: string
}

interface MapOpts {
  documentTitle: string // "Credit Voucher" | "Debit Voucher"
  partyLabel: string // "Customer" | "Vendor"
}

function pick(...vals: Array<unknown>): string | undefined {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return String(v)
  }
  return undefined
}

/**
 * Human label for how the voucher was paid. Falls back to inferring from
 * cheque/bank data, and finally to the bank/cash account title (a cash
 * account title like "Cash in Hand" reads correctly as "Cash").
 */
function resolvePaymentMethod(v: VoucherRow): string | undefined {
  const explicit = pick(v.payment_method)
  if (explicit) return explicit
  if (pick(v.cheque_number)) return "Cheque"
  const bankCash = pick(v.bank_cash_name)
  if (bankCash) {
    return /cash/i.test(bankCash) ? "Cash" : "Bank Transfer"
  }
  return undefined
}

/** "2010 - Accounts Payable" when a code exists, otherwise just the name. */
function headOfAccountLabel(v: VoucherRow): string | undefined {
  const name = pick(v.expense_head_name)
  if (!name) return undefined
  const code = pick(v.expense_head_code)
  return code ? `${code} - ${name}` : name
}

/** Map a voucher row into the shared View-modal shape. */
export function voucherToViewData(v: VoucherRow, opts: MapOpts): VoucherViewData {
  return {
    title: `${opts.documentTitle} — ${v.voucher_no ?? ""}`.trim(),
    voucherNo: v.voucher_no,
    date: v.date,
    voucherType: opts.documentTitle.replace(" Voucher", ""),
    status: v.is_confirmed ? "Confirmed" : "Pending",
    project: v.project_name,
    billNo: v.bill_no,
    partyLabel: v.party_type === "Contractor" ? "Contractor" : opts.partyLabel,
    partyName: v.vendor_display_name,
    partyAddress: v.vendor_address,
    partyPhone: v.vendor_phone,
    partyEmail: v.vendor_email,
    paymentMethod: resolvePaymentMethod(v),
    bankName: v.bank_cash_name,
    chequeNo: v.cheque_number,
    referenceNumber: v.bill_no,
    headOfAccount: headOfAccountLabel(v),
    description: pick(v.description, v.memo),
    narration: v.particulars,
    amount: Number(v.amount) || 0,
    preparedBy: v.created_by_name,
  }
}

/** Map a voucher row into the shared client-facing receipt PDF shape. */
export function voucherToReceiptData(v: VoucherRow, opts: MapOpts): VoucherReceiptData {
  const amount = Number(v.amount) || 0
  const paymentMethod = resolvePaymentMethod(v)
  const isCash = paymentMethod === "Cash"

  // When the voucher settles a PO through several partial payments, show every
  // payment record; otherwise fall back to a single row from the voucher itself.
  const paymentRecords = Array.isArray(v.payment_records) ? v.payment_records : []
  const rows: VoucherReceiptRow[] =
    paymentRecords.length > 0
      ? paymentRecords.map((p) => ({
          description: pick(
            p.payment_number && p.payment_date
              ? `${p.payment_number} (${p.payment_date})`
              : p.payment_number,
            v.particulars,
            "Payment",
          ),
          bank: pick(p.payment_method?.toLowerCase() === "cash" ? "Cash" : p.bank_name, p.payment_method),
          chequeNo: p.cheque_number,
          chequeDate: p.cheque_date,
          reference: pick(p.reference, v.bill_no),
          amount: Number(p.amount) || 0,
        }))
      : [
          {
            description: pick(v.particulars, v.description, v.expense_head_name, "Payment"),
            bank: isCash ? "Cash" : v.bank_cash_name,
            chequeNo: v.cheque_number,
            chequeDate: v.cheque_date,
            reference: v.bill_no,
            amount,
          },
        ]

  return {
    documentTitle: opts.documentTitle,
    voucherNo: v.voucher_no,
    voucherDate: v.date,
    voucherType: opts.documentTitle.replace(" Voucher", ""),
    status: v.is_confirmed ? "Confirmed" : "Pending",
    // Contractor payments print "Contractor" instead of the default label
    partyLabel: v.party_type === "Contractor" ? "Contractor" : opts.partyLabel,
    partyName: v.vendor_display_name,
    partyCode: v.vendor_code,
    partyContactPerson: v.vendor_contact_person,
    partyAddress: v.vendor_address,
    partyPhone: v.vendor_phone,
    partyEmail: v.vendor_email,
    paymentMethod,
    // For cash payments show "Cash" instead of leaving bank info blank.
    bankName: isCash ? "Cash" : v.bank_cash_name,
    chequeNo: v.cheque_number,
    chequeDate: v.cheque_date,
    referenceNumber: v.bill_no,
    poNumber: v.po_number,
    headOfAccount: headOfAccountLabel(v),
    purpose: pick(v.description, v.memo),
    narration: v.particulars,
    totalAmount: amount,
    rows,
    preparedBy: v.created_by_name,
  }
}
