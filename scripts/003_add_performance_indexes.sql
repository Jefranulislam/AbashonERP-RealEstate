-- ============================================
-- Performance Optimization Indexes
-- Run this in your Neon database console
-- ============================================

-- Finance Types - Speed up listing and filtering
CREATE INDEX IF NOT EXISTS idx_income_expense_types_active 
ON income_expense_types(is_active, created_at DESC)
WHERE is_active = true;

-- Expense Heads - Speed up listing and searches
CREATE INDEX IF NOT EXISTS idx_expense_heads_active 
ON income_expense_heads(is_active, head_name)
WHERE is_active = true;

-- Expense Heads - Speed up JOINs with types
CREATE INDEX IF NOT EXISTS idx_expense_heads_type_id 
ON income_expense_heads(inc_exp_type_id)
WHERE inc_exp_type_id IS NOT NULL;

-- Bank/Cash Accounts - Speed up listing
CREATE INDEX IF NOT EXISTS idx_bank_cash_accounts_active 
ON bank_cash_accounts(is_active, account_title)
WHERE is_active = true;

-- Initial Bank Cash - Speed up lookups
CREATE INDEX IF NOT EXISTS idx_initial_bank_cash_account 
ON initial_bank_cash(bank_cash_id);

-- Initial Expense Heads - Speed up lookups
CREATE INDEX IF NOT EXISTS idx_initial_expense_heads_project 
ON initial_expense_heads(project_id);

CREATE INDEX IF NOT EXISTS idx_initial_expense_heads_head 
ON initial_expense_heads(expense_head_id);

-- Projects - Speed up listing (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_projects_active 
ON projects(is_active, project_name)
WHERE is_active = true;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'income_expense_types',
    'income_expense_heads',
    'bank_cash_accounts',
    'initial_bank_cash',
    'initial_expense_heads',
    'projects'
)
ORDER BY tablename, indexname;
