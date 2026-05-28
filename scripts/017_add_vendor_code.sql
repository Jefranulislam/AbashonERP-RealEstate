-- Migration: Add vendor_code to vendors and backfill existing records
-- Date: 2026-05-22

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(20);

WITH ordered_vendors AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM vendors
  WHERE vendor_code IS NULL OR TRIM(vendor_code) = ''
)
UPDATE vendors v
SET vendor_code = 'V' || (1000 + ordered_vendors.rn)::text
FROM ordered_vendors
WHERE v.id = ordered_vendors.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_vendors_vendor_code ON vendors(vendor_code);
