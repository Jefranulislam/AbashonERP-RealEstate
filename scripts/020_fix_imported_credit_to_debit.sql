-- ========================================
-- Migration 020: Fix imported vouchers wrongly classified as Credit
-- These are vendor payments (money OUT) imported with voucher_type = Credit.
-- They must be Debit. This flips the type and renumbers CR-* -> DV-*.
--
-- Runs atomically: if any line fails, the whole thing rolls back (no partial change).
-- Safe to re-run. Only run after confirming there are NO genuine money-IN
-- (customer receipt) Credit vouchers.
-- ========================================

BEGIN;

-- 1) Park the to-be-flipped rows on temporary unique numbers so the
--    renumber step cannot collide with existing DV-* numbers.
UPDATE vouchers
SET voucher_no = 'TMPFLIP-' || id
WHERE LOWER(TRIM(voucher_type)) IN ('credit', 'cr');

-- 2) Flip the voucher type to Debit.
UPDATE vouchers
SET voucher_type = 'Debit',
    updated_at = CURRENT_TIMESTAMP
WHERE voucher_no LIKE 'TMPFLIP-%';

-- 3) Assign new DV-{year}-{seq} numbers, continuing AFTER the highest existing
--    Debit sequence for that year. The regex guard ('^DV-[0-9]{4}-[0-9]+$')
--    ignores any existing Debit voucher whose number is not in clean DV-YYYY-NNNN
--    form, so a stray/legacy number can never break the integer conversion.
WITH existing_max AS (
  SELECT
    split_part(voucher_no, '-', 2)::int AS yr,
    MAX(split_part(voucher_no, '-', 3)::int) AS max_seq
  FROM vouchers
  WHERE voucher_no ~ '^DV-[0-9]{4}-[0-9]+$'
  GROUP BY 1
),
to_number AS (
  SELECT
    v.id,
    EXTRACT(YEAR FROM v.date)::int AS yr,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM v.date)
      ORDER BY v.date, v.id
    ) AS rn
  FROM vouchers v
  WHERE v.voucher_no LIKE 'TMPFLIP-%'
)
UPDATE vouchers v
SET voucher_no = 'DV-' || t.yr || '-' ||
                 LPAD((COALESCE(em.max_seq, 0) + t.rn)::text, 4, '0')
FROM to_number t
LEFT JOIN existing_max em ON em.yr = t.yr
WHERE v.id = t.id;

COMMIT;
