-- Enhance cheques table with additional fields
ALTER TABLE cheques 
ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS received_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS cleared_date DATE,
ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN cheques.status IS 'Possible values: Pending, Submitted, Cleared, Bounced';
COMMENT ON COLUMN cheques.received_date IS 'Date when cheque was received from customer';
COMMENT ON COLUMN cheques.submitted_date IS 'Date when cheque was submitted to bank';
COMMENT ON COLUMN cheques.cleared_date IS 'Date when cheque was cleared by bank';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cheques_customer_id ON cheques(customer_id);
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_cheque_date ON cheques(cheque_date);
