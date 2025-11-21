-- Enhance advance_payables table with additional fields
ALTER TABLE advance_payables 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Advance',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

-- Add comments for clarity
COMMENT ON COLUMN advance_payables.payment_type IS 'Possible values: Advance, Payable, Payment';
COMMENT ON COLUMN advance_payables.payment_method IS 'Cash, Cheque, Bank Transfer, etc.';
COMMENT ON COLUMN advance_payables.status IS 'Possible values: Pending, Paid, Partial, Cancelled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advance_payables_project_id ON advance_payables(project_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_vendor_id ON advance_payables(vendor_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_constructor_id ON advance_payables(constructor_id);
CREATE INDEX IF NOT EXISTS idx_advance_payables_status ON advance_payables(status);
CREATE INDEX IF NOT EXISTS idx_advance_payables_payment_date ON advance_payables(payment_date);

-- Update existing records to have Pending status
UPDATE advance_payables SET status = 'Pending' WHERE status IS NULL;
UPDATE advance_payables SET payment_type = 'Advance' WHERE payment_type IS NULL;

SELECT 'Migration completed successfully!' as message;
