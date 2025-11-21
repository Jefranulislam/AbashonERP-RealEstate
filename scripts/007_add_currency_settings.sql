-- Add currency settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'BDT',
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '৳';

-- Update existing records to have default currency
UPDATE settings SET currency_code = 'BDT', currency_symbol = '৳' WHERE currency_code IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN settings.currency_code IS 'ISO 4217 currency code (e.g., BDT, USD, EUR)';
COMMENT ON COLUMN settings.currency_symbol IS 'Currency symbol to display (e.g., ৳, $, €)';

SELECT 'Currency settings migration completed successfully!' as message;
