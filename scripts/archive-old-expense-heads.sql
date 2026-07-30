-- =====================================================================
-- archive-old-expense-heads.sql
-- Hide the 32 legacy flat ledgers (codes 1000-1031) and keep the
-- structured 1100-6400 hierarchy. Already applied via script on the DB.
--
-- Verified: 0 rows in vouchers / journal_voucher_details /
-- purchase_order_items / purchase_requisition_items reference these
-- heads, so this is safe. Archive (soft) chosen = reversible.
-- Result: 96 rows total, 64 active.
-- =====================================================================

-- APPLIED: archive (soft-delete) the old flat ledgers
UPDATE income_expense_heads
SET is_active = false, updated_at = CURRENT_TIMESTAMP
WHERE account_code BETWEEN '1000' AND '1031';

-- -------------------------------------------------------------------
-- ROLLBACK (bring the 32 old heads back):
-- UPDATE income_expense_heads
-- SET is_active = true, updated_at = CURRENT_TIMESTAMP
-- WHERE account_code BETWEEN '1000' AND '1031';

-- HARD DELETE instead (permanent — only safe because 0 refs; run AFTER
-- you are sure you never want them back):
-- DELETE FROM income_expense_heads WHERE account_code BETWEEN '1000' AND '1031';
-- =====================================================================
