-- =====================================================================
-- reset-transactional-data.sql
-- One-shot wipe of the transactional layer so you can RE-IMPORT clean
-- data (with the fixed dd-mm-yyyy parser) and get IDs starting at 1.
--
-- WHY: legacy import swapped dd-mm-yyyy -> mm-dd-yyyy on the way in.
-- The wrong values are already stored; the only FULL-correct fix is to
-- clear these tables and re-upload the original files. This also resets
-- every id sequence back to 1 (your task 2).
--
-- ⚠️  DESTRUCTIVE + IRREVERSIBLE. Deletes ALL rows in the tables below.
--     Only run during setup / before go-live. Take a Neon branch/backup
--     first (Neon dashboard -> Branches -> create branch = instant snapshot).
--
-- CASCADE also empties these child tables:
--   vouchers            -> journal_voucher_details, sale_payments,
--                          payment_transactions
--   purchase_orders     -> purchase_order_items, payment_schedules,
--                          material_deliveries, payment_transactions
--   payment_transactions-> payment_history
--   sales               -> sale_payments, sale_payment_schedules,
--                          sale_activities, sale_documents,
--                          sale_additional_items
--
-- Master data (vendors, constructors, projects, customers, products,
-- employees, expense heads, bank accounts) is NOT touched.
-- =====================================================================

BEGIN;

TRUNCATE TABLE
  vouchers,
  purchase_orders,
  payment_transactions,
  sales
RESTART IDENTITY CASCADE;

COMMIT;

-- After COMMIT: go to Settings -> Imports and re-upload each file
-- (transactions, purchase_orders, vendor_payments, sales). Parser now
-- reads dd-mm-yyyy correctly. Spot-check one known date after import.
