-- Add terms_conditions column to sales table
-- This allows each booking to have customizable terms and conditions

ALTER TABLE sales ADD COLUMN IF NOT EXISTS terms_conditions TEXT;

-- Set default terms for existing sales (can be customized per sale)
UPDATE sales 
SET terms_conditions = 'This booking is subject to the terms mentioned in the final agreement.
Down payment must be made within 30 days of booking.
Monthly installments will start from the 2nd month after booking.
Delay in payment may attract late fee as per company policy.
Registration and other government charges are extra.
Handover date is tentative and subject to construction progress.'
WHERE terms_conditions IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN sales.terms_conditions IS 'Custom terms and conditions for this booking, shown on print receipt';
