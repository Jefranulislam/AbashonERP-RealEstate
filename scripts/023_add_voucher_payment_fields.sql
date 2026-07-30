-- Migration: payment fields for vouchers + vendor contact person
-- 1. Cheque date on vouchers (cheque_number already exists; date was missing)
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS cheque_date DATE;

-- 2. Payment method on vouchers (also created by scripts/add-voucher-columns.ts; kept here for SQL-only setups)
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);

-- 3. Contact person on vendors (shown on debit voucher receipts)
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

-- 4. Contractor reference on vouchers (debit vouchers can pay contractors too)
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS constructor_id INTEGER REFERENCES constructors(id);

COMMENT ON COLUMN vouchers.cheque_date IS 'Cheque date when the voucher is paid by cheque';
COMMENT ON COLUMN vouchers.payment_method IS 'Cash, Bank Transfer, Cheque, Online, etc.';
COMMENT ON COLUMN vendors.contact_person IS 'Primary contact person at the vendor';
COMMENT ON COLUMN vouchers.constructor_id IS 'Optional reference to a contractor when the voucher pays a contractor instead of a vendor';

-- 5. Advance/Payable module: accounting head + bank details per record
ALTER TABLE advance_payables
ADD COLUMN IF NOT EXISTS expense_head_id INTEGER REFERENCES income_expense_heads(id);

ALTER TABLE advance_payables
ADD COLUMN IF NOT EXISTS bank_cash_id INTEGER REFERENCES bank_cash_accounts(id);

ALTER TABLE advance_payables
ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(50);

ALTER TABLE advance_payables
ADD COLUMN IF NOT EXISTS cheque_date DATE;
