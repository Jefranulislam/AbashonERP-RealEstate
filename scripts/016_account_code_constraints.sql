-- Migration: Enforce 4-digit account_code uniqueness and format
-- Date: 2026-05-18

ALTER TABLE income_expense_heads
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(4);

ALTER TABLE income_expense_heads
  ADD COLUMN IF NOT EXISTS head_type VARCHAR(100);

ALTER TABLE income_expense_heads
  ADD COLUMN IF NOT EXISTS account_category VARCHAR(100);

ALTER TABLE income_expense_heads
  ALTER COLUMN account_code TYPE VARCHAR(4)
  USING LEFT(account_code, 4);

-- Create unique index for account_code (allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_income_expense_heads_account_code ON income_expense_heads(account_code);

-- Add a CHECK constraint to enforce 4-digit numeric format when not null
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_income_exp_heads_account_code_format'
  ) THEN
    ALTER TABLE income_expense_heads
      ADD CONSTRAINT chk_income_exp_heads_account_code_format CHECK (account_code IS NULL OR account_code ~ '^[0-9]{4}$') NOT VALID;
  END IF;
END$$;

-- Note: Existing rows with non-null, non-4-digit account_code will cause the constraint to fail.
-- Backfill strategy: run a script to assign codes for existing rows before making account_code NOT NULL.
