import { sql } from "@/lib/db"
import { buildVoucherNo, normalizeVoucherType } from "@/lib/voucher-utils"

type Row = Record<string, any>

export type SubledgerLookups = {
  projectsByName: Map<string, number>
  projectsById: Map<string, number>
  vendorsByName: Map<string, number>
  vendorsById: Map<string, number>
  constructorsByName: Map<string, number>
  constructorsById: Map<string, number>
  expenseHeadsByName: Map<string, number>
  expenseHeadsByAccountCode: Map<string, number>
  expenseHeadsById: Map<string, number>
  bankCashByTitle: Map<string, number>
  bankCashById: Map<string, number>
  purchaseOrdersByNumber: Map<string, number>
  purchaseOrdersById: Map<string, number>
  salesByNo: Map<string, number>
  salesById: Map<string, number>
  customersById: Map<string, number>
}

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase()
}

function resolveId(map: Map<string, number>, value: any): number | null {
  const key = normalizeKey(String(value || ""))
  if (!key) return null
  return map.get(key) ?? null
}

function resolveFirstRowValue(row: Row, keys: string[]): any {
  for (const key of keys) {
    const value = row[key]
    if (String(value ?? "").trim()) return value
  }
  return null
}

export function toImportBoolean(value: any, fallback = false): boolean {
  const str = String(value ?? "").trim().toLowerCase()
  if (["1", "true", "yes", "y"].includes(str)) return true
  if (["0", "false", "no", "n"].includes(str)) return false
  return fallback
}

export function resolveProjectId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.projectsByName, resolveFirstRowValue(row, ["project_name", "project"])) ??
    resolveId(lookups.projectsById, resolveFirstRowValue(row, ["project_id"]))
  )
}

export function resolveExpenseHeadId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.expenseHeadsByName, resolveFirstRowValue(row, ["expense_head_name", "head_name", "expense_head"])) ??
    resolveId(lookups.expenseHeadsByAccountCode, resolveFirstRowValue(row, ["expense_head_code", "account_code", "head_code"])) ??
    resolveId(lookups.expenseHeadsById, resolveFirstRowValue(row, ["expense_head_id", "head_id"]))
  )
}

export function resolveBankCashId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.bankCashByTitle, resolveFirstRowValue(row, ["bank_account_title", "bank_account_name", "bank_account"])) ??
    resolveId(lookups.bankCashById, resolveFirstRowValue(row, ["bank_account_id", "cash_account_id"]))
  )
}

export function resolvePoId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.purchaseOrdersByNumber, resolveFirstRowValue(row, ["po_number"])) ??
    resolveId(lookups.purchaseOrdersById, resolveFirstRowValue(row, ["po_id"]))
  )
}

export function resolveSaleId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.salesByNo, resolveFirstRowValue(row, ["sale_no"])) ??
    resolveId(lookups.salesById, resolveFirstRowValue(row, ["sale_id"]))
  )
}

export function resolveVendorId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.vendorsByName, resolveFirstRowValue(row, ["vendor_name", "vendor"])) ??
    resolveId(lookups.vendorsById, resolveFirstRowValue(row, ["vendor_id"]))
  )
}

export function resolveConstructorId(lookups: SubledgerLookups, row: Row): number | null {
  return (
    resolveId(lookups.constructorsByName, resolveFirstRowValue(row, ["constructor_name", "contractor_name", "constructor", "contractor"])) ??
    resolveId(lookups.constructorsById, resolveFirstRowValue(row, ["constructor_id", "contractor_id"]))
  )
}

/** Read a PO's party (vendor OR contractor) so payments/vouchers can inherit it. */
async function getPoParty(poId: number): Promise<{ vendorId: number | null; constructorId: number | null }> {
  const rows = await sql`SELECT vendor_id, constructor_id FROM purchase_orders WHERE id = ${poId} LIMIT 1`
  if (rows.length === 0) return { vendorId: null, constructorId: null }
  return {
    vendorId: rows[0].vendor_id != null ? Number(rows[0].vendor_id) : null,
    constructorId: rows[0].constructor_id != null ? Number(rows[0].constructor_id) : null,
  }
}

async function getNextVoucherNo(voucherType: string, date: string): Promise<string> {
  const countRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM vouchers
    WHERE CASE
      WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
      WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
      WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
      WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
      ELSE voucher_type
    END = ${voucherType}
  `
  const serial = Number(countRows[0]?.count || 0) + 1
  return buildVoucherNo(voucherType, serial, new Date(date).getFullYear())
}

export async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastPayment = await sql`
    SELECT payment_number FROM payment_transactions
    WHERE payment_number LIKE ${`PAY-${year}-%`}
    ORDER BY created_at DESC LIMIT 1
  `
  const lastNum =
    lastPayment.length > 0 ? parseInt(String(lastPayment[0].payment_number).split("-")[2], 10) : 0
  return `PAY-${year}-${String(lastNum + 1).padStart(4, "0")}`
}

export async function generateReceiptNumber(): Promise<string> {
  try {
    const receiptNoResult = await sql`SELECT generate_receipt_no() as receipt_no`
    if (receiptNoResult[0]?.receipt_no) return String(receiptNoResult[0].receipt_no)
  } catch {
    // fallback below
  }
  const year = new Date().getFullYear()
  const lastReceipt = await sql`
    SELECT receipt_no FROM sale_payments
    WHERE receipt_no LIKE ${`RCP-${year}-%`}
    ORDER BY created_at DESC LIMIT 1
  `
  const lastNum =
    lastReceipt.length > 0 ? parseInt(String(lastReceipt[0].receipt_no).split("-")[2], 10) : 0
  return `RCP-${year}-${String(lastNum + 1).padStart(4, "0")}`
}

export type VoucherInsertResult = { voucherId: number; voucherNo: string }

export async function insertDebitCreditVoucher(
  lookups: SubledgerLookups,
  row: Row,
  voucherType: "Credit" | "Debit",
  date: string,
  amount: number,
  isConfirmed: boolean
): Promise<VoucherInsertResult> {
  const vendorId = row.vendor_name || row.vendor_id ? resolveVendorId(lookups, row) : null
  let constructorId = resolveConstructorId(lookups, row)
  let constructorName = String(row.constructor_name || row.contractor_name || "").trim() || null

  // No named party but a PO is referenced → inherit the PO's party.
  if (!vendorId && !constructorId) {
    const poId = resolvePoId(lookups, row)
    if (poId) {
      const party = await getPoParty(poId)
      if (party.vendorId) {
        // vendor PO: handled via vendor_id below is not set here; fall through to reference
      }
      constructorId = party.constructorId
    }
  }
  if (constructorId && !constructorName) {
    const c = await sql`SELECT constructor_name FROM constructors WHERE id = ${constructorId} LIMIT 1`
    constructorName = c.length ? String(c[0].constructor_name) : null
  }

  const referencePartyType = row.reference_party_type
    ? String(row.reference_party_type).toUpperCase().trim()
    : constructorId
      ? "CONTRACTOR"
      : null
  const referencePartyName = row.reference_party_name
    ? String(row.reference_party_name).trim()
    : constructorName

  // AP (Debit): party required. AR/Credit: party optional (e.g. customer receipts).
  if (voucherType === "Debit" && !vendorId && !referencePartyName) {
    throw new Error("A vendor_name, constructor_name, po_number, or reference_party_name must be provided for Debit vouchers")
  }
  if (referencePartyName && !referencePartyType && !vendorId) {
    throw new Error("reference_party_type must be specified when reference_party_name is provided")
  }

  const finalReferencePartyType =
    vendorId && !referencePartyType
      ? "VENDOR"
      : referencePartyType ||
        (row.customer_name ? "CUSTOMER" : null)
  const finalReferencePartyName =
    referencePartyName || (row.customer_name ? String(row.customer_name).trim() : null)
  const projectId = resolveProjectId(lookups, row)
  const expenseHeadId = resolveExpenseHeadId(lookups, row)
  const bankCashId = resolveBankCashId(lookups, row)
  const voucherNo = await getNextVoucherNo(voucherType, date)

  const voucherRows = await sql`
    INSERT INTO vouchers (
      voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
      bill_no, date, amount, particulars, cheque_number, is_confirmed,
      vendor_id, reference_party_type, reference_party_name
    ) VALUES (
      ${voucherNo}, ${voucherType}, ${projectId}, ${expenseHeadId}, ${bankCashId},
      ${row.bill_no || null}, ${date}, ${amount}, ${row.particulars || null},
      ${row.cheque_number || null}, ${isConfirmed},
      ${vendorId || null}, ${finalReferencePartyType || null}, ${finalReferencePartyName || null}
    )
    RETURNING id
  `

  return { voucherId: Number(voucherRows[0].id), voucherNo }
}

/** AP subledger: vendor payment linked to PO and optional GL voucher (Debit). */
export async function insertVendorPayment(
  lookups: SubledgerLookups,
  row: Row,
  options: {
    date: string
    amount: number
    voucherId?: number | null
    poId?: number | null
    vendorId?: number | null
    constructorId?: number | null
    projectId?: number | null
    bankCashId?: number | null
    paymentStatus?: string
  }
): Promise<void> {
  const poId = options.poId ?? resolvePoId(lookups, row)
  let vendorId = options.vendorId ?? resolveVendorId(lookups, row)
  let constructorId = options.constructorId ?? resolveConstructorId(lookups, row)
  const projectId = options.projectId ?? resolveProjectId(lookups, row)
  const bankCashId = options.bankCashId ?? resolveBankCashId(lookups, row)

  // If the row named no party but points at a PO, inherit the PO's party.
  // Contractor POs carry constructor_id, vendor POs carry vendor_id — so a
  // contractor payment imports with just po_number, no contractor code needed.
  if (!vendorId && !constructorId && poId) {
    const party = await getPoParty(poId)
    vendorId = party.vendorId
    constructorId = party.constructorId
  }

  const referencePartyType = row.reference_party_type
    ? String(row.reference_party_type).toUpperCase().trim()
    : null
  const referencePartyName = row.reference_party_name
    ? String(row.reference_party_name).trim()
    : null

  if (!vendorId && !constructorId && !referencePartyName) {
    throw new Error("A vendor_name, constructor_name, po_number, or reference_party_name is required for the payment")
  }
  if (referencePartyName && !referencePartyType && !vendorId && !constructorId) {
    throw new Error("reference_party_type is required when reference_party_name is provided")
  }

  const paymentNumber =
    String(row.payment_number || "").trim() || (await generatePaymentNumber())
  const rawPaymentStatus = String(row.payment_status || options.paymentStatus || "Completed").trim()
  // Normalize completed-variants to canonical 'Completed' so PO payment totals match (see scripts/021)
  const paymentStatus = ["completed", "paid", "cleared", "complete"].includes(rawPaymentStatus.toLowerCase())
    ? "Completed"
    : rawPaymentStatus
  const paymentType = String(row.payment_type || "Partial").trim()
  const paymentMethod = String(row.payment_method || "Bank Transfer").trim()

  const paymentRows = await sql`
    INSERT INTO payment_transactions (
      payment_number, po_id, vendor_id, constructor_id, project_id,
      payment_date, payment_type, payment_method, amount,
      bank_account_id, cheque_number, transaction_reference,
      voucher_id, receipt_number, receipt_issued_by, receipt_date,
      payment_status, remarks,
      reference_party_type, reference_party_name
    ) VALUES (
      ${paymentNumber},
      ${poId || null},
      ${vendorId || null},
      ${constructorId || null},
      ${projectId || null},
      ${options.date},
      ${paymentType},
      ${paymentMethod},
      ${options.amount},
      ${bankCashId || null},
      ${row.cheque_number || null},
      ${row.transaction_reference || null},
      ${options.voucherId || null},
      ${paymentNumber},
      ${"Import"},
      ${options.date},
      ${paymentStatus},
      ${row.remarks || row.particulars || null},
      ${vendorId ? "VENDOR" : constructorId ? "CONTRACTOR" : referencePartyType || null},
      ${referencePartyName || null}
    )
    RETURNING id
  `

  await sql`
    INSERT INTO payment_history (
      payment_id, action_type, changed_by, new_amount, new_status, reason
    ) VALUES (
      ${paymentRows[0].id},
      'Created',
      ${null},
      ${options.amount},
      ${paymentStatus},
      'Imported vendor payment'
    )
  `
}

/** AR subledger: customer receipt linked to sale and optional GL voucher (Credit). */
export async function insertCustomerReceipt(
  lookups: SubledgerLookups,
  row: Row,
  options: {
    date: string
    amount: number
    voucherId?: number | null
    saleId: number
    bankCashId?: number | null
  }
): Promise<void> {
  const saleRows = await sql`
    SELECT id, customer_id, project_id FROM sales WHERE id = ${options.saleId} LIMIT 1
  `
  if (saleRows.length === 0) throw new Error("Sale not found for customer receipt")

  const sale = saleRows[0]
  const bankCashId = options.bankCashId ?? resolveBankCashId(lookups, row)
  const receiptNo = String(row.receipt_no || "").trim() || (await generateReceiptNumber())
  const paymentMethod = String(row.payment_method || "cash").trim().toLowerCase()
  const status = String(row.status || row.payment_status || "received").trim().toLowerCase()

  await sql`
    INSERT INTO sale_payments (
      receipt_no, sale_id, customer_id, schedule_id,
      payment_date, amount, payment_method,
      bank_cash_id, cheque_number, cheque_date, cheque_bank,
      transaction_reference, voucher_id, status, remarks
    ) VALUES (
      ${receiptNo},
      ${options.saleId},
      ${sale.customer_id},
      ${row.schedule_id ? Number(row.schedule_id) : null},
      ${options.date},
      ${options.amount},
      ${paymentMethod},
      ${bankCashId || null},
      ${row.cheque_number || null},
      ${row.cheque_date || null},
      ${row.cheque_bank || null},
      ${row.transaction_reference || null},
      ${options.voucherId || null},
      ${status},
      ${row.remarks || row.particulars || null}
    )
  `
}

/** After GL voucher import: sync AP/AR subledgers when PO or sale is referenced. */
export async function syncSubledgerFromVoucher(
  lookups: SubledgerLookups,
  row: Row,
  voucherType: string,
  voucherId: number,
  date: string,
  amount: number
): Promise<void> {
  const shouldSync = toImportBoolean(
    row.create_payment_record ?? row.sync_subledger,
    true
  )
  if (!shouldSync) return

  const poId = resolvePoId(lookups, row)
  const saleId = resolveSaleId(lookups, row)
  const normalizedType = normalizeVoucherType(voucherType)

  if (poId && normalizedType === "Debit") {
    await insertVendorPayment(lookups, row, {
      date,
      amount,
      voucherId,
      poId,
      paymentStatus: String(row.payment_status || "Completed"),
    })
    return
  }

  if (saleId && normalizedType === "Credit") {
    await insertCustomerReceipt(lookups, row, {
      date,
      amount,
      voucherId,
      saleId,
    })
  }
}
