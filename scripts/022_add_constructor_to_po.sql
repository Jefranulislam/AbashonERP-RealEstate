-- 022: Add contractor support to Purchase Orders (progressive/contractor billing)
-- Purpose: A PO can now be raised to EITHER a vendor OR a constructor (contractor).
--          Downstream payment totals / partial-payment / payment_status logic is
--          unchanged — it keys on po_id and already sums payment_transactions.
--          This just lets a PO belong to a contractor and surfaces the party name.
--
-- Contractor progressive billing (Odoo "Case 1"): one open PO, many partial
-- payment_transactions over time at a fixed rate. No new PO per payment.

-- (a) Add columns. vendor_id stays as-is (nullable FK); contractor POs leave it NULL.
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS constructor_id INTEGER REFERENCES constructors(id),
  ADD COLUMN IF NOT EXISTS party_type VARCHAR(20) DEFAULT 'Vendor'; -- 'Vendor' | 'Contractor'

COMMENT ON COLUMN purchase_orders.constructor_id IS 'Set when party_type = Contractor; mutually exclusive with vendor_id';
COMMENT ON COLUMN purchase_orders.party_type IS 'Vendor or Contractor - which party this PO is raised to';

CREATE INDEX IF NOT EXISTS idx_po_constructor_id ON purchase_orders(constructor_id);

-- (b) Backfill: existing rows are all vendor POs.
UPDATE purchase_orders SET party_type = 'Vendor' WHERE party_type IS NULL;

-- (c) Rebuild PO summary view to expose the party (vendor OR constructor) name.
-- DROP first: column set/order changes, which CREATE OR REPLACE VIEW forbids.
DROP VIEW IF EXISTS vw_po_summary;
CREATE VIEW vw_po_summary AS
SELECT
    po.id,
    po.po_number,
    po.order_date,
    po.expected_delivery_date,
    po.total_amount,
    po.status as po_status,
    po.party_type,
    v.vendor_name,
    c.constructor_name,
    COALESCE(v.vendor_name, c.constructor_name) as party_name,
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
LEFT JOIN constructors c ON po.constructor_id = c.id
LEFT JOIN projects p ON po.project_id = p.id
LEFT JOIN payment_transactions pt
    ON po.id = pt.po_id
    AND LOWER(TRIM(pt.payment_status)) IN ('completed', 'paid', 'cleared')
    AND pt.is_active = true
WHERE po.is_active = true
GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date,
         po.total_amount, po.status, po.party_type,
         v.vendor_name, c.constructor_name, p.project_name;
