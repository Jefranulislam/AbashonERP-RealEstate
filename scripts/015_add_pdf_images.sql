-- Add PDF image customization fields to settings table
-- This migration adds support for company logo, footer image, and background graphic

-- Add columns for PDF image customization
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_image TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS background_image TEXT;

-- Update the table structure comments
COMMENT ON COLUMN settings.company_logo IS 'Stores the base64 encoded logo image for PDF headers';
COMMENT ON COLUMN settings.footer_image IS 'Stores the base64 encoded footer image for PDFs';
COMMENT ON COLUMN settings.background_image IS 'Stores the base64 encoded background graphic for left side of PDFs';

-- Create index for faster retrieval of settings with images
CREATE INDEX IF NOT EXISTS idx_settings_images ON settings(company_logo, footer_image, background_image);

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'PDF image customization fields added to settings table successfully';
END $$;