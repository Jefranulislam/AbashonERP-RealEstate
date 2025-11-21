-- Add contra voucher specific fields to vouchers table
-- For contra vouchers, we need two bank/cash accounts (from and to)

-- Add debit bank_cash account field (from account - where money comes FROM)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS dr_bank_cash_id INTEGER REFERENCES bank_cash_accounts(id);

-- Add credit bank_cash account field (to account - where money goes TO)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS cr_bank_cash_id INTEGER REFERENCES bank_cash_accounts(id);

-- Add description field for contra vouchers
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vouchers_dr_bank_cash ON vouchers(dr_bank_cash_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_cr_bank_cash ON vouchers(cr_bank_cash_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_type_date ON vouchers(voucher_type, date DESC);

-- Add comments for clarity
COMMENT ON COLUMN vouchers.dr_bank_cash_id IS 'Debit bank/cash account (FROM account for contra vouchers)';
COMMENT ON COLUMN vouchers.cr_bank_cash_id IS 'Credit bank/cash account (TO account for contra vouchers)';
COMMENT ON COLUMN vouchers.bank_cash_id IS 'Single bank/cash account (for Credit/Debit vouchers)';
COMMENT ON COLUMN vouchers.description IS 'Description/notes for voucher (especially for contra/journal vouchers)';
