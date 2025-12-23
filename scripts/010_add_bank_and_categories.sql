-- Migration: Add bank information and materials/work types to vendors and constructors
-- Date: 2025-12-24
-- Description: Adds bank account details, materials for vendors, and work types for constructors

-- Add columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_swift_code VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS materials TEXT[];

-- Add columns to constructors table
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(50);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS bank_swift_code VARCHAR(50);
ALTER TABLE constructors ADD COLUMN IF NOT EXISTS work_types TEXT[];

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_materials ON vendors USING GIN (materials);
CREATE INDEX IF NOT EXISTS idx_constructors_work_types ON constructors USING GIN (work_types);

-- Add comments
COMMENT ON COLUMN vendors.materials IS 'Array of material types the vendor supplies: Cement, Sand, Steel, Silicon Sand, Bricks, etc.';
COMMENT ON COLUMN vendors.bank_name IS 'Name of the bank where vendor has account';
COMMENT ON COLUMN constructors.work_types IS 'Array of work types the constructor specializes in: Civil, Electrical, Plumbing, Roofing, etc.';
COMMENT ON COLUMN constructors.bank_name IS 'Name of the bank where constructor has account';
