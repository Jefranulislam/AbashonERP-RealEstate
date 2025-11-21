-- Run this SQL in your database client to update the cheques table
-- This adds the new fields needed for the enhanced Cheques Management system

-- Add new columns
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS cleared_date DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cheques_customer_id ON cheques(customer_id);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_cheque_date ON cheques(cheque_date);

-- Update existing records to have Pending status
UPDATE cheques SET status = 'Pending' WHERE status IS NULL;

SELECT 'Migration completed successfully!' as message;
