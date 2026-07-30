import { sql } from "@/lib/db"

let voucherPaymentSchemaPromise: Promise<void> | null = null

/**
 * Runtime-safe schema bootstrap (same pattern as ensureVendorCodeSchema):
 * adds payment fields used by voucher receipts. Mirrors
 * scripts/023_add_voucher_payment_fields.sql for SQL-only setups.
 */
export async function ensureVoucherPaymentSchema(): Promise<void> {
  if (!voucherPaymentSchemaPromise) {
    voucherPaymentSchemaPromise = (async () => {
      await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS cheque_date DATE`
      await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255)`
      await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS constructor_id INTEGER REFERENCES constructors(id)`
      // Non-vendor party support (mirrors scripts/018_add_reference_party_fields.sql)
      await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS reference_party_type VARCHAR(50)`
      await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS reference_party_name VARCHAR(255)`
      await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)`
      // Advance/Payable module: accounting + bank details on each record
      await sql`ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS expense_head_id INTEGER REFERENCES income_expense_heads(id)`
      await sql`ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS bank_cash_id INTEGER REFERENCES bank_cash_accounts(id)`
      await sql`ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(50)`
      await sql`ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS cheque_date DATE`
    })()
  }

  return voucherPaymentSchemaPromise
}
