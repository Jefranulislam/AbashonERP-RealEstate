-- Run this SQL in your database client to update the advance_payables table
-- This adds the new fields needed for the enhanced Advance/Payable Management system

-- Add new columns
ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Advance';
ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE advance_payables ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advance_payables_project_id ON advance_payables(project_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_vendor_id ON advance_payables(vendor_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_constructor_id ON advance_payables(constructor_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_status ON advance_payables(status);
CREATE INDEX IF NOT EXISTS idx_advance_payables_payment_date ON advance_payables(payment_date);

-- Update existing records to have default values
UPDATE advance_payables SET status = 'Pending' WHERE status IS NULL;
UPDATE advance_payables SET payment_type = 'Advance' WHERE payment_type IS NULL;

SELECT 'Migration completed successfully!' as message;
