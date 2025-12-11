-- ========================================
-- Material Purchase & Payment Tracking Migration
-- Created: December 11, 2025
-- Purpose: Add complete material tracking, purchase orders, deliveries, and payment schedules
-- ========================================

-- ========================================
-- STEP 1: Enhance Purchase Requisition Items (Add Material Details)
-- ========================================
ALTER TABLE purchase_requisition_items 
ADD COLUMN IF NOT EXISTS material_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS material_specification TEXT,
ADD COLUMN IF NOT EXISTS unit_of_measurement VARCHAR(50),
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id),
ADD COLUMN IF NOT EXISTS delivery_location TEXT,
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'Normal';

COMMENT ON COLUMN purchase_requisition_items.material_type IS 'Material category: Sand, Steel, Cement, Bricks, etc.';
COMMENT ON COLUMN purchase_requisition_items.material_specification IS 'Detailed specs: Grade, Size, Quality, Brand';
COMMENT ON COLUMN purchase_requisition_items.unit_of_measurement IS 'CFT, KG, TON, BAG, PIECE, etc.';
COMMENT ON COLUMN purchase_requisition_items.urgency_level IS 'Normal, Urgent, Critical';

-- ========================================
-- STEP 2: Create Purchase Orders Table
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id INTEGER REFERENCES purchase_requisitions(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Dates
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial Details
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- Terms & Conditions
    payment_terms TEXT,
    delivery_terms TEXT,
    terms_and_conditions TEXT,
    
    -- Status & Tracking
    status VARCHAR(50) DEFAULT 'Draft',
    notes TEXT,
    
    -- Approval
    prepared_by INTEGER REFERENCES employees(id),
    approved_by INTEGER REFERENCES employees(id),
    approval_date DATE,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN purchase_orders.status IS 'Draft, Sent, Acknowledged, In Progress, Completed, Cancelled';
COMMENT ON COLUMN purchase_orders.payment_terms IS 'E.g., 30% Advance, 50% on Delivery, 20% after 15 days';

CREATE INDEX IF NOT EXISTS idx_po_requisition_id ON purchase_orders(requisition_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_order_date ON purchase_orders(order_date);

-- ========================================
-- STEP 3: Create Purchase Order Items Table
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    requisition_item_id INTEGER REFERENCES purchase_requisition_items(id),
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    
    -- Material Details
    material_type VARCHAR(100),
    material_specification TEXT,
    description TEXT,
    
    -- Quantity & Pricing
    qty DECIMAL(10, 2) NOT NULL,
    unit_of_measurement VARCHAR(50),
    rate DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    
    -- Delivery Tracking
    delivered_qty DECIMAL(10, 2) DEFAULT 0,
    accepted_qty DECIMAL(10, 2) DEFAULT 0,
    rejected_qty DECIMAL(10, 2) DEFAULT 0,
    remaining_qty DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_poi_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_poi_expense_head_id ON purchase_order_items(expense_head_id);

-- ========================================
-- STEP 4: Create Material Deliveries Table
-- ========================================
CREATE TABLE IF NOT EXISTS material_deliveries (
    id SERIAL PRIMARY KEY,
    delivery_number VARCHAR(50) UNIQUE NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id),
    po_item_id INTEGER REFERENCES purchase_order_items(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Delivery Details
    delivery_date DATE NOT NULL,
    delivery_time TIME,
    delivery_slip_number VARCHAR(100),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    
    -- Received Details
    received_by INTEGER REFERENCES employees(id),
    received_date DATE NOT NULL,
    received_time TIME,
    
    -- Material Details
    material_type VARCHAR(100),
    material_specification TEXT,
    ordered_qty DECIMAL(10, 2),
    delivered_qty DECIMAL(10, 2),
    accepted_qty DECIMAL(10, 2),
    rejected_qty DECIMAL(10, 2),
    shortage_qty DECIMAL(10, 2),
    excess_qty DECIMAL(10, 2),
    unit_of_measurement VARCHAR(50),
    
    -- Quality Check
    quality_status VARCHAR(50) DEFAULT 'Pending',
    quality_checked_by INTEGER REFERENCES employees(id),
    quality_check_date DATE,
    quality_remarks TEXT,
    quality_photos TEXT,
    
    -- Storage Details
    storage_location TEXT,
    warehouse_section VARCHAR(100),
    
    -- Status
    delivery_status VARCHAR(50) DEFAULT 'Pending',
    remarks TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN material_deliveries.quality_status IS 'Pending, Passed, Failed, Partial';
COMMENT ON COLUMN material_deliveries.delivery_status IS 'Pending, In Transit, Received, Inspected, Accepted, Rejected';
COMMENT ON COLUMN material_deliveries.quality_photos IS 'JSON array of photo URLs';

CREATE INDEX IF NOT EXISTS idx_delivery_po_id ON material_deliveries(po_id);
CREATE INDEX IF NOT EXISTS idx_delivery_vendor_id ON material_deliveries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_delivery_project_id ON material_deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON material_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON material_deliveries(delivery_status);

-- ========================================
-- STEP 5: Create Payment Schedules Table
-- ========================================
CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    schedule_number VARCHAR(50),
    
    -- Payment Details
    payment_type VARCHAR(50),
    payment_percentage DECIMAL(5, 2),
    scheduled_amount DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    
    -- Payment Status
    status VARCHAR(50) DEFAULT 'Pending',
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    due_amount DECIMAL(15, 2),
    last_payment_date DATE,
    
    -- Conditions
    payment_condition TEXT,
    is_conditional BOOLEAN DEFAULT false,
    condition_met BOOLEAN DEFAULT false,
    condition_met_date DATE,
    
    -- Metadata
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN payment_schedules.payment_type IS 'Advance, On Delivery, After Delivery, Final, Installment';
COMMENT ON COLUMN payment_schedules.status IS 'Pending, Partial, Paid, Overdue, Cancelled';
COMMENT ON COLUMN payment_schedules.payment_condition IS 'E.g., On Order, On Delivery, 30 Days After Delivery';

CREATE INDEX IF NOT EXISTS idx_ps_po_id ON payment_schedules(po_id);
CREATE INDEX IF NOT EXISTS idx_ps_status ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_ps_due_date ON payment_schedules(due_date);

-- ========================================
-- STEP 6: Create Payment Transactions Table
-- ========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id),
    delivery_id INTEGER REFERENCES material_deliveries(id),
    schedule_id INTEGER REFERENCES payment_schedules(id),
    vendor_id INTEGER REFERENCES vendors(id),
    constructor_id INTEGER REFERENCES constructors(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Payment Details
    payment_date DATE NOT NULL,
    payment_time TIME,
    payment_type VARCHAR(50),
    payment_method VARCHAR(50),
    amount DECIMAL(15, 2) NOT NULL,
    
    -- Bank/Cheque Details
    bank_account_id INTEGER REFERENCES bank_cash_accounts(id),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    transaction_reference VARCHAR(100),
    
    -- Linked Accounting
    voucher_id INTEGER REFERENCES vouchers(id),
    
    -- Receipt Details
    receipt_number VARCHAR(50),
    receipt_issued_by VARCHAR(255),
    receipt_date DATE,
    
    -- Status & Tracking
    payment_status VARCHAR(50) DEFAULT 'Pending',
    verified_by INTEGER REFERENCES employees(id),
    verification_date DATE,
    
    -- Metadata
    remarks TEXT,
    attachments TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN payment_transactions.payment_type IS 'Advance, Partial, Full, Due Settlement, Installment';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Cash, Bank Transfer, Cheque, Mobile Banking, Credit Card';
COMMENT ON COLUMN payment_transactions.payment_status IS 'Pending, Completed, Failed, Reversed, Cancelled';
COMMENT ON COLUMN payment_transactions.attachments IS 'JSON array of receipt/slip URLs';

CREATE INDEX IF NOT EXISTS idx_pt_po_id ON payment_transactions(po_id);
CREATE INDEX IF NOT EXISTS idx_pt_vendor_id ON payment_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pt_project_id ON payment_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_pt_payment_date ON payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_pt_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_pt_voucher_id ON payment_transactions(voucher_id);

-- ========================================
-- STEP 7: Create Payment History Table (Audit Trail)
-- ========================================
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payment_transactions(id),
    action_type VARCHAR(50),
    changed_by INTEGER REFERENCES employees(id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_amount DECIMAL(15, 2),
    new_amount DECIMAL(15, 2),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    reason TEXT,
    ip_address VARCHAR(50)
);

COMMENT ON COLUMN payment_history.action_type IS 'Created, Modified, Verified, Reversed, Cancelled';

CREATE INDEX IF NOT EXISTS idx_ph_payment_id ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_ph_change_date ON payment_history(change_date);

-- ========================================
-- STEP 8: Enhance Income/Expense Heads for Material Tracking
-- ========================================
ALTER TABLE income_expense_heads 
ADD COLUMN IF NOT EXISTS head_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS material_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS default_unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_inventory_tracked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_stock DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS average_rate DECIMAL(15, 2);

COMMENT ON COLUMN income_expense_heads.head_category IS 'Raw Material, Labor, Equipment, Service, Other';
COMMENT ON COLUMN income_expense_heads.material_type IS 'If head_category is Raw Material: Sand, Steel, Cement, etc.';

-- ========================================
-- STEP 9: Create Triggers for Auto-Updates
-- ========================================

-- Trigger to update remaining_qty in purchase_order_items when delivery is recorded
CREATE OR REPLACE FUNCTION update_po_item_delivery_qty()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_order_items
    SET 
        delivered_qty = delivered_qty + NEW.delivered_qty,
        accepted_qty = accepted_qty + NEW.accepted_qty,
        rejected_qty = rejected_qty + NEW.rejected_qty,
        remaining_qty = qty - (delivered_qty + NEW.delivered_qty),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.po_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_delivery
AFTER INSERT ON material_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_po_item_delivery_qty();

-- Trigger to update payment schedule when payment is made
CREATE OR REPLACE FUNCTION update_payment_schedule()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.schedule_id IS NOT NULL THEN
        UPDATE payment_schedules
        SET 
            paid_amount = paid_amount + NEW.amount,
            due_amount = scheduled_amount - (paid_amount + NEW.amount),
            status = CASE 
                WHEN (paid_amount + NEW.amount) >= scheduled_amount THEN 'Paid'
                WHEN (paid_amount + NEW.amount) > 0 THEN 'Partial'
                ELSE 'Pending'
            END,
            last_payment_date = NEW.payment_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.schedule_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_schedule
AFTER INSERT ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_schedule();

-- Trigger to update PO status based on deliveries
CREATE OR REPLACE FUNCTION update_po_status()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items
    FROM purchase_order_items
    WHERE po_id = NEW.po_id;
    
    SELECT COUNT(*) INTO completed_items
    FROM purchase_order_items
    WHERE po_id = NEW.po_id AND remaining_qty <= 0;
    
    IF completed_items = total_items THEN
        UPDATE purchase_orders
        SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.po_id;
    ELSIF completed_items > 0 THEN
        UPDATE purchase_orders
        SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.po_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_status
AFTER UPDATE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_status();

-- ========================================
-- STEP 10: Create Views for Quick Reports
-- ========================================

-- View: Purchase Order Summary with Payment Status
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
LEFT JOIN payment_transactions pt ON po.id = pt.po_id AND pt.payment_status = 'Completed'
WHERE po.is_active = true
GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date, po.total_amount, po.status, v.vendor_name, p.project_name;

-- View: Material-wise Purchase Summary
CREATE OR REPLACE VIEW vw_material_purchase_summary AS
SELECT 
    poi.material_type,
    COUNT(DISTINCT po.id) as total_orders,
    SUM(poi.qty) as total_qty_ordered,
    SUM(poi.delivered_qty) as total_qty_delivered,
    SUM(poi.accepted_qty) as total_qty_accepted,
    SUM(poi.rejected_qty) as total_qty_rejected,
    poi.unit_of_measurement,
    SUM(poi.amount) as total_amount,
    AVG(poi.rate) as average_rate
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.po_id = po.id
WHERE po.is_active = true
GROUP BY poi.material_type, poi.unit_of_measurement;

-- View: Pending Payments Report
CREATE OR REPLACE VIEW vw_pending_payments AS
SELECT 
    ps.id as schedule_id,
    po.po_number,
    po.order_date,
    v.vendor_name,
    p.project_name,
    ps.payment_type,
    ps.scheduled_amount,
    ps.paid_amount,
    ps.due_amount,
    ps.due_date,
    CASE 
        WHEN ps.due_date < CURRENT_DATE THEN 'Overdue'
        WHEN ps.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'Upcoming'
    END as urgency,
    CURRENT_DATE - ps.due_date as days_overdue
FROM payment_schedules ps
JOIN purchase_orders po ON ps.po_id = po.id
JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN projects p ON po.project_id = p.id
WHERE ps.status IN ('Pending', 'Partial') AND ps.is_active = true
ORDER BY ps.due_date ASC;

-- ========================================
-- STEP 11: Insert Sample Data (Optional - Comment out if not needed)
-- ========================================

-- Sample Material Types in Income/Expense Heads
-- UNCOMMENT BELOW TO INSERT SAMPLE DATA
/*
UPDATE income_expense_heads 
SET head_category = 'Raw Material', 
    material_type = 'Sand', 
    default_unit = 'CFT',
    is_inventory_tracked = true
WHERE head_name ILIKE '%sand%';

UPDATE income_expense_heads 
SET head_category = 'Raw Material', 
    material_type = 'Steel', 
    default_unit = 'KG',
    is_inventory_tracked = true
WHERE head_name ILIKE '%steel%';

UPDATE income_expense_heads 
SET head_category = 'Raw Material', 
    material_type = 'Cement', 
    default_unit = 'BAG',
    is_inventory_tracked = true
WHERE head_name ILIKE '%cement%';
*/

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Material Purchase & Payment Tracking Migration Completed Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '  - purchase_orders';
    RAISE NOTICE '  - purchase_order_items';
    RAISE NOTICE '  - material_deliveries';
    RAISE NOTICE '  - payment_schedules';
    RAISE NOTICE '  - payment_transactions';
    RAISE NOTICE '  - payment_history';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Views:';
    RAISE NOTICE '  - vw_po_summary';
    RAISE NOTICE '  - vw_material_purchase_summary';
    RAISE NOTICE '  - vw_pending_payments';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Triggers:';
    RAISE NOTICE '  - Auto-update delivery quantities';
    RAISE NOTICE '  - Auto-update payment schedules';
    RAISE NOTICE '  - Auto-update PO status';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Create API endpoints';
    RAISE NOTICE '  2. Build UI pages';
    RAISE NOTICE '  3. Test complete workflow';
    RAISE NOTICE '========================================';
END $$;

SELECT 'Migration Script Ready to Execute!' as status;
