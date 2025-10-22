-- Migration: Add fields to income_expense_heads for better accounting classification
-- Date: 2025-10-13
-- Purpose: Enable proper Trial Balance, P&L, and Balance Sheet generation

-- Add account_code field for better organization
ALTER TABLE income_expense_heads 
ADD COLUMN IF NOT EXISTS account_code VARCHAR(50);

-- Add head_type for P&L categorization (e.g., "Revenue", "Direct Costs", "Operating Expenses", etc.)
ALTER TABLE income_expense_heads 
ADD COLUMN IF NOT EXISTS head_type VARCHAR(100);

-- Add account_category for Balance Sheet classification
-- Examples: "Current Assets", "Fixed Assets", "Current Liabilities", "Long-term Liabilities", "Equity"
ALTER TABLE income_expense_heads 
ADD COLUMN IF NOT EXISTS account_category VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_income_expense_heads_account_code 
ON income_expense_heads(account_code);

CREATE INDEX IF NOT EXISTS idx_income_expense_heads_head_type 
ON income_expense_heads(head_type);

CREATE INDEX IF NOT EXISTS idx_income_expense_heads_account_category 
ON income_expense_heads(account_category);

-- Add comments for documentation
COMMENT ON COLUMN income_expense_heads.account_code IS 'Unique account code for ledger identification (e.g., 1000, 2000, etc.)';
COMMENT ON COLUMN income_expense_heads.head_type IS 'Type/category for P&L grouping (e.g., Project Revenue, Direct Costs, Operating Expenses)';
COMMENT ON COLUMN income_expense_heads.account_category IS 'Category for Balance Sheet classification (e.g., Current Assets, Fixed Assets, Current Liabilities, Long-term Liabilities, Equity)';

-- Sample data update (optional - can be done later through UI)
-- UPDATE income_expense_heads SET account_code = '1000', account_category = 'Current Assets' WHERE head_name = 'Cash';
-- UPDATE income_expense_heads SET account_code = '1001', account_category = 'Current Assets' WHERE head_name = 'Bank';
-- UPDATE income_expense_heads SET account_code = '4000', head_type = 'Operating Expenses' WHERE type = 'Dr';
-- UPDATE income_expense_heads SET account_code = '3000', head_type = 'Revenue' WHERE type = 'Cr';
