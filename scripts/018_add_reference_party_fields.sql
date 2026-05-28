-- Migration: Add Reference Party Fields for Non-Vendor Transactions
-- Date: 2026-05-28
-- Purpose: Support transactions that don't require a traditional vendor (e.g., land agreements, government fees, individual payments)
-- This implements the ERP best practice of separating vendor-based purchases from direct payments

-- ========================================
-- STEP 1: Enhance payment_transactions Table
-- ========================================

-- Add reference_party_type field
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS reference_party_type VARCHAR(50);

-- Add reference_party_name field
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS reference_party_name VARCHAR(255);

-- Add reference_party_id for future linking to parties table (optional)
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS reference_party_id INTEGER;

-- Add comments
COMMENT ON COLUMN payment_transactions.reference_party_type IS 'Type of party: Vendor, Individual, Government, Entity, Other. Used when vendor_id is null.';
COMMENT ON COLUMN payment_transactions.reference_party_name IS 'Name of the party when not linked to vendors table (e.g., Land Owner name, Government Agency, etc.)';
COMMENT ON COLUMN payment_transactions.reference_party_id IS 'Reserved for future linking to a generic parties/contacts table';

-- Create index for reference_party lookups
CREATE INDEX IF NOT EXISTS idx_pt_reference_party_type 
ON payment_transactions(reference_party_type);

CREATE INDEX IF NOT EXISTS idx_pt_reference_party_name 
ON payment_transactions(reference_party_name);

-- ========================================
-- STEP 2: Enhance vouchers Table (Accounting)
-- ========================================

ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id);

ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS reference_party_type VARCHAR(50);

ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS reference_party_name VARCHAR(255);

ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS reference_party_id INTEGER;

COMMENT ON COLUMN vouchers.vendor_id IS 'Optional reference to vendor for purchase-related vouchers';
COMMENT ON COLUMN vouchers.reference_party_type IS 'Type of party: Vendor, Individual, Government, Entity, Other. Used when vendor_id is null.';
COMMENT ON COLUMN vouchers.reference_party_name IS 'Name of the party when not linked to vendors table';
COMMENT ON COLUMN vouchers.reference_party_id IS 'Reserved for future linking to a generic parties/contacts table';

CREATE INDEX IF NOT EXISTS idx_voucher_reference_party_type 
ON vouchers(reference_party_type);

CREATE INDEX IF NOT EXISTS idx_voucher_reference_party_name 
ON vouchers(reference_party_name);

-- ========================================
-- STEP 3: Enhance advance_payables Table
-- ========================================

ALTER TABLE advance_payables 
ADD COLUMN IF NOT EXISTS reference_party_type VARCHAR(50);

ALTER TABLE advance_payables 
ADD COLUMN IF NOT EXISTS reference_party_name VARCHAR(255);

COMMENT ON COLUMN advance_payables.reference_party_type IS 'Type of party: Vendor, Constructor, Individual, Government, Entity, Other';
COMMENT ON COLUMN advance_payables.reference_party_name IS 'Name of the party when not linked to vendors/constructors';

-- ========================================
-- STEP 4: Create Validation View
-- ========================================
-- View to identify transactions that need vendor_id or reference_party_name
CREATE OR REPLACE VIEW vw_incomplete_transactions AS
SELECT 
    pt.id,
    pt.payment_number,
    pt.payment_date,
    pt.amount,
    pt.vendor_id,
    pt.reference_party_name,
    pt.reference_party_type,
    ieh.head_name,
    p.project_name,
    CASE 
        WHEN pt.vendor_id IS NULL AND pt.reference_party_name IS NULL 
        THEN 'INCOMPLETE: Missing both vendor_id and reference_party_name'
        WHEN pt.vendor_id IS NOT NULL AND pt.reference_party_name IS NOT NULL 
        THEN 'WARNING: Both vendor_id and reference_party_name are set'
        ELSE 'OK'
    END AS validation_status
FROM payment_transactions pt
LEFT JOIN income_expense_heads ieh ON pt.schedule_id = (
    SELECT id FROM payment_schedules WHERE po_id = (
        SELECT po_id FROM payment_transactions WHERE id = pt.id
    ) LIMIT 1
)
LEFT JOIN projects p ON pt.project_id = p.id
WHERE pt.is_active = true;

-- ========================================
-- STEP 5: Sample Data Update (Optional - for demonstration)
-- ========================================
-- Uncomment to populate existing vendor-based transactions with reference_party_type = 'Vendor'
-- UPDATE payment_transactions 
-- SET reference_party_type = 'Vendor' 
-- WHERE vendor_id IS NOT NULL AND reference_party_type IS NULL;

-- ========================================
-- STEP 6: Create Reference Party Types Table (Future Enhancement)
-- ========================================
-- This table can be used to standardize reference party types
CREATE TABLE IF NOT EXISTS reference_party_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard reference party types
INSERT INTO reference_party_types (type_code, type_name, description) VALUES
    ('VENDOR', 'Vendor', 'Traditional supplier or vendor'),
    ('INDIVIDUAL', 'Individual', 'Private individual (e.g., land owner, consultant)'),
    ('GOVERNMENT', 'Government', 'Government agency or authority'),
    ('ENTITY', 'Business Entity', 'Company, partnership, or other business entity'),
    ('EMPLOYEE', 'Employee', 'Company employee (for advances, bonuses)'),
    ('CONTRACTOR', 'Contractor', 'Construction or service contractor'),
    ('OTHER', 'Other', 'Other type of party')
ON CONFLICT (type_code) DO NOTHING;

-- ========================================
-- STEP 7: Create Expense Head Categories Table (Future Enhancement)
-- ========================================
-- Define which expense heads require vendor vs allow reference party
CREATE TABLE IF NOT EXISTS expense_head_party_rules (
    id SERIAL PRIMARY KEY,
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    party_type_required VARCHAR(50), -- 'VENDOR_REQUIRED', 'VENDOR_OPTIONAL', 'REFERENCE_PARTY_ONLY'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expense_head_id)
);

COMMENT ON TABLE expense_head_party_rules IS 'Business rules for each expense head type - determines if vendor is required or optional';
COMMENT ON COLUMN expense_head_party_rules.party_type_required IS 'VENDOR_REQUIRED: Must have vendor_id, VENDOR_OPTIONAL: Can have vendor_id or reference_party, REFERENCE_PARTY_ONLY: Cannot use vendor_id';

-- ========================================
-- STEP 8: Sample Expense Head Rules (Optional)
-- ========================================
-- These are examples - you should configure based on your Chart of Accounts
-- Uncomment and customize as needed
/*
INSERT INTO expense_head_party_rules (expense_head_id, party_type_required, description) VALUES
    (
        (SELECT id FROM income_expense_heads WHERE head_name LIKE '%Land Signing%' LIMIT 1),
        'REFERENCE_PARTY_ONLY',
        'Land agreements use individual names, not vendors'
    ),
    (
        (SELECT id FROM income_expense_heads WHERE head_name LIKE '%Government Fee%' LIMIT 1),
        'REFERENCE_PARTY_ONLY',
        'Government fees use agency names, not vendors'
    ),
    (
        (SELECT id FROM income_expense_heads WHERE head_name LIKE '%Material Purchase%' LIMIT 1),
        'VENDOR_REQUIRED',
        'Material purchases must be from vendors'
    ),
    (
        (SELECT id FROM income_expense_heads WHERE head_name LIKE '%Professional Service%' LIMIT 1),
        'VENDOR_OPTIONAL',
        'Services can be from vendor or individual consultant'
    )
ON CONFLICT (expense_head_id) DO NOTHING;
*/

-- ========================================
-- STEP 9: Data Migration for Existing Transactions
-- ========================================
-- Automatically populate reference_party_type for transactions with vendor_id
UPDATE payment_transactions 
SET reference_party_type = 'VENDOR'
WHERE vendor_id IS NOT NULL 
  AND reference_party_type IS NULL 
  AND is_active = true;

-- Similarly for vouchers
UPDATE vouchers 
SET reference_party_type = 'VENDOR'
WHERE vendor_id IS NOT NULL 
  AND reference_party_type IS NULL;

-- ========================================
-- STEP 10: Create Validation Trigger (Optional - for PostgreSQL)
-- ========================================
/*
CREATE OR REPLACE FUNCTION validate_transaction_party()
RETURNS TRIGGER AS $$
BEGIN
    -- Check that at least one party identifier is provided
    IF NEW.vendor_id IS NULL AND NEW.reference_party_name IS NULL THEN
        RAISE EXCEPTION 'Transaction must have either vendor_id or reference_party_name';
    END IF;
    
    -- Check that both are not set simultaneously (unless intentional)
    -- Comment out if you want to allow both
    -- IF NEW.vendor_id IS NOT NULL AND NEW.reference_party_name IS NOT NULL THEN
    --     RAISE EXCEPTION 'Transaction cannot have both vendor_id and reference_party_name';
    -- END IF;
    
    -- If reference_party_name is set, reference_party_type must be set
    IF NEW.reference_party_name IS NOT NULL AND NEW.reference_party_type IS NULL THEN
        RAISE EXCEPTION 'reference_party_type must be specified when reference_party_name is set';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_validate_transaction_party ON payment_transactions;

-- Create trigger
CREATE TRIGGER trg_validate_transaction_party
BEFORE INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION validate_transaction_party();
*/

-- ========================================
-- Summary of Changes
-- ========================================
-- 1. payment_transactions: +3 columns (reference_party_type, reference_party_name, reference_party_id)
-- 2. vouchers: +3 columns + 1 FOREIGN KEY (vendor_id, reference_party_type, reference_party_name, reference_party_id)
-- 3. advance_payables: +2 columns (reference_party_type, reference_party_name)
-- 4. New tables: reference_party_types, expense_head_party_rules
-- 5. New view: vw_incomplete_transactions (helps identify incomplete party records)
-- 
-- Key Benefits:
-- - Vendor field remains optional and nullable
-- - Clear differentiation between vendor-based and direct payments
-- - Audit trail for different party types
-- - Foundation for future reference party master table
-- - Backward compatible (no breaking changes to existing data)
