-- 021: Fix PO payment status mismatch
-- Cause: PO list/detail + vw_po_summary counted a payment toward a PO only when
--        pt.payment_status = 'Completed' (exact, case-sensitive) AND pt.po_id linked.
--        Imported/default payments with variant status ('completed', 'Paid', 'Cleared',
--        'Pending' etc.) were excluded, so paid POs showed "Unpaid".
-- Fix:   (a) normalize existing payment_status values to canonical 'Completed'
--        (b) rebuild vw_po_summary with case-insensitive match + is_active filter
--        (API routes app/api/purchase/orders/*.ts already patched to match)

-- (a) Normalize existing status strings to canonical 'Completed'
UPDATE payment_transactions
SET payment_status = 'Completed'
WHERE LOWER(TRIM(payment_status)) IN ('completed', 'paid', 'cleared', 'complete');

-- (b) Rebuild view with robust join
CREATE OR REPLACE VIEW vw_po_summary AS
SELECT
    po.id,
    po.po_number,
    po.order_date,
    po.expected_delivery_date,
    po.total_amount,
    po.status as po_status,
    v.vendor_name,
    p.project_name,
    COALESCE(SUM(pt.amount), 0) as total_paid,
    po.total_amount - COALESCE(SUM(pt.amount), 0) as total_due,
    CASE
        WHEN COALESCE(SUM(pt.amount), 0) = 0 THEN 'Unpaid'
        WHEN COALESCE(SUM(pt.amount), 0) >= po.total_amount THEN 'Fully Paid'
        ELSE 'Partial'
    END as payment_status
FROM purchase_orders po
LEFT JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN projects p ON po.project_id = p.id
LEFT JOIN payment_transactions pt
    ON po.id = pt.po_id
    AND LOWER(TRIM(pt.payment_status)) IN ('completed', 'paid', 'cleared')
    AND pt.is_active = true
WHERE po.is_active = true
GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date, po.total_amount, po.status, v.vendor_name, p.project_name;

-- Diagnostic: payments still unlinked to any PO (po_id NULL) will NOT count toward
-- any PO regardless of status. These must be re-linked manually or via re-import
-- with a valid po_number. List them:
--   SELECT id, payment_number, vendor_id, amount, payment_status, reference_party_name
--   FROM payment_transactions WHERE po_id IS NULL AND is_active = true;
