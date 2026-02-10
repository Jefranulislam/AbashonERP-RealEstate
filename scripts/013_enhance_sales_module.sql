-- =====================================================
-- REAL ESTATE SALES MODULE ENHANCEMENT
-- Complete Sales Ecosystem for Real Estate ERP
-- =====================================================

-- 1. ENHANCE PRODUCTS TABLE (Units/Flats/Plots)
-- Add real estate specific fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50); -- 'Apartment', 'Shop', 'Plot', 'Parking'
ALTER TABLE products ADD COLUMN IF NOT EXISTS floor_no VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_sqft DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS facing VARCHAR(50); -- 'North', 'South', 'East', 'West'
ALTER TABLE products ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'available'; -- 'available', 'booked', 'sold', 'handed_over'
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT; -- JSON array of features
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT; -- JSON array of image URLs

-- 2. ENHANCE SALES TABLE (Booking/Sale Master)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_no VARCHAR(50) UNIQUE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(30) DEFAULT 'booking'; -- 'booking', 'direct_sale'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_status VARCHAR(30) DEFAULT 'booked'; -- 'booked', 'agreement_signed', 'in_progress', 'completed', 'handed_over', 'cancelled'

-- Pricing Details
ALTER TABLE sales ADD COLUMN IF NOT EXISTS base_price DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS net_price DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_amount DECIMAL(15, 2); -- Token/Booking money
ALTER TABLE sales ADD COLUMN IF NOT EXISTS down_payment DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(15, 2);

-- Payment Terms
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(50); -- 'full', 'installment', 'milestone'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installment_count INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(15, 2);

-- Dates
ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS agreement_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS expected_handover_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS actual_handover_date DATE;

-- Documents & Notes
ALTER TABLE sales ADD COLUMN IF NOT EXISTS agreement_no VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS terms_conditions TEXT;

-- Nominee Details (Co-applicant)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_phone VARCHAR(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_nid VARCHAR(50);

-- Reference/Commission
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reference_by VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

-- 3. PAYMENT SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS sale_payment_schedules (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    schedule_type VARCHAR(30) NOT NULL, -- 'booking', 'down_payment', 'installment', 'milestone', 'handover'
    installment_no INTEGER,
    description VARCHAR(255),
    due_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PAYMENT COLLECTION TABLE (Money Receipts)
CREATE TABLE IF NOT EXISTS sale_payments (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    sale_id INTEGER REFERENCES sales(id),
    customer_id INTEGER REFERENCES customers(id),
    schedule_id INTEGER REFERENCES sale_payment_schedules(id),
    
    -- Payment Details
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- 'cash', 'cheque', 'bank_transfer', 'online'
    
    -- Bank/Cheque Details
    bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    cheque_bank VARCHAR(255),
    transaction_reference VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'received', -- 'received', 'deposited', 'cleared', 'bounced', 'cancelled'
    
    -- Accounting Link
    voucher_id INTEGER REFERENCES vouchers(id),
    
    -- Notes
    remarks TEXT,
    received_by INTEGER REFERENCES employees(id),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SALE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS sale_documents (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'booking_form', 'agreement', 'nid_copy', 'photo', 'payment_receipt', 'handover_letter'
    document_name VARCHAR(255),
    document_url TEXT,
    uploaded_by INTEGER REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SALE ACTIVITY LOG (Audit Trail)
CREATE TABLE IF NOT EXISTS sale_activities (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'payment_received', 'document_uploaded', 'sms_sent', 'email_sent'
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SMS/NOTIFICATION LOG TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(30) NOT NULL, -- 'sms', 'email', 'whatsapp'
    recipient_type VARCHAR(30), -- 'customer', 'employee'
    recipient_id INTEGER,
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    
    -- Content
    template_name VARCHAR(100),
    subject VARCHAR(255),
    message TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    error_message TEXT,
    
    -- Reference
    reference_type VARCHAR(50), -- 'sale', 'payment', 'reminder'
    reference_id INTEGER,
    
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SMS TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS sms_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'payment_received', 'payment_reminder', 'handover_notice'
    message_template TEXT NOT NULL, -- Use {{customer_name}}, {{amount}}, {{unit_name}} etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default SMS templates
INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
('Booking Confirmation', 'booking_confirmation', 
 'Dear {{customer_name}}, Your booking for {{unit_name}} at {{project_name}} is confirmed. Booking No: {{sale_no}}. Total: {{net_price}}. Thank you for choosing us!'),
('Payment Received', 'payment_received', 
 'Dear {{customer_name}}, We received {{amount}} for {{unit_name}}. Receipt: {{receipt_no}}. Outstanding: {{outstanding}}. Thank you!'),
('Payment Reminder', 'payment_reminder', 
 'Dear {{customer_name}}, Reminder: Payment of {{amount}} for {{unit_name}} is due on {{due_date}}. Please pay on time. Thank you!'),
('Payment Overdue', 'payment_overdue', 
 'Dear {{customer_name}}, Your payment of {{amount}} for {{unit_name}} is overdue since {{due_date}}. Please pay immediately to avoid penalty.'),
('Handover Notice', 'handover_notice', 
 'Dear {{customer_name}}, Congratulations! Your {{unit_name}} at {{project_name}} is ready for handover. Please contact us to schedule.')
ON CONFLICT (template_name) DO NOTHING;

-- 9. SETTINGS FOR SALES MODULE
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sale_prefix VARCHAR(20) DEFAULT 'SALE';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(20) DEFAULT 'RCP';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_sender_id VARCHAR(20);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_password TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_create_voucher BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS payment_reminder_days INTEGER DEFAULT 3; -- Days before due date

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_sale_no ON sales(sale_no);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_sales_booking_date ON sales(booking_date);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_sale_payments_receipt_no ON sale_payments(receipt_no);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_schedules_due_date ON sale_payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_sale_schedules_status ON sale_payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 11. VIEW FOR SALES SUMMARY
CREATE OR REPLACE VIEW sale_summary AS
SELECT 
    s.id,
    s.sale_no,
    s.sale_status,
    c.customer_name,
    c.phone as customer_phone,
    p.project_name,
    pr.product_name,
    pr.unit_no,
    pr.floor_no,
    s.net_price,
    s.total_paid,
    s.outstanding_amount,
    s.booking_date,
    s.expected_handover_date,
    e.name as seller_name,
    (SELECT COUNT(*) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.is_active = true) as payment_count,
    (SELECT COUNT(*) FROM sale_payment_schedules sps WHERE sps.sale_id = s.id AND sps.status = 'overdue') as overdue_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN projects p ON s.project_id = p.id
LEFT JOIN products pr ON s.product_id = pr.id
LEFT JOIN employees e ON s.seller_id = e.id
WHERE s.is_active = true;

-- 12. VIEW FOR PAYMENT DUE REPORT
CREATE OR REPLACE VIEW payment_due_report AS
SELECT 
    sps.id as schedule_id,
    s.sale_no,
    c.customer_name,
    c.phone as customer_phone,
    p.project_name,
    pr.product_name,
    pr.unit_no,
    sps.schedule_type,
    sps.installment_no,
    sps.due_date,
    sps.amount,
    sps.paid_amount,
    (sps.amount - sps.paid_amount) as balance_due,
    sps.status,
    CASE 
        WHEN sps.status = 'paid' THEN 0
        WHEN sps.due_date < CURRENT_DATE THEN (CURRENT_DATE - sps.due_date)
        ELSE 0
    END as days_overdue
FROM sale_payment_schedules sps
JOIN sales s ON sps.sale_id = s.id
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN projects p ON s.project_id = p.id
LEFT JOIN products pr ON s.product_id = pr.id
WHERE sps.is_active = true AND sps.status != 'paid'
ORDER BY sps.due_date;

-- 13. FUNCTION TO UPDATE SALE TOTALS
CREATE OR REPLACE FUNCTION update_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sales
    SET 
        total_paid = (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE sale_id = NEW.sale_id AND is_active = true AND status NOT IN ('bounced', 'cancelled')),
        outstanding_amount = net_price - (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE sale_id = NEW.sale_id AND is_active = true AND status NOT IN ('bounced', 'cancelled')),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.sale_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update sale totals on payment
DROP TRIGGER IF EXISTS trigger_update_sale_totals ON sale_payments;
CREATE TRIGGER trigger_update_sale_totals
AFTER INSERT OR UPDATE OR DELETE ON sale_payments
FOR EACH ROW
EXECUTE FUNCTION update_sale_totals();

-- 14. FUNCTION TO UPDATE SCHEDULE STATUS
CREATE OR REPLACE FUNCTION update_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update schedule paid amount
    UPDATE sale_payment_schedules
    SET 
        paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE schedule_id = NEW.schedule_id AND is_active = true AND status NOT IN ('bounced', 'cancelled')),
        status = CASE 
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE schedule_id = NEW.schedule_id AND is_active = true AND status NOT IN ('bounced', 'cancelled')) >= amount THEN 'paid'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE schedule_id = NEW.schedule_id AND is_active = true AND status NOT IN ('bounced', 'cancelled')) > 0 THEN 'partial'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.schedule_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update schedule on payment
DROP TRIGGER IF EXISTS trigger_update_schedule_status ON sale_payments;
CREATE TRIGGER trigger_update_schedule_status
AFTER INSERT OR UPDATE ON sale_payments
FOR EACH ROW
WHEN (NEW.schedule_id IS NOT NULL)
EXECUTE FUNCTION update_schedule_status();

-- 15. FUNCTION TO GENERATE SALE NUMBER
CREATE OR REPLACE FUNCTION generate_sale_no()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    sale_no TEXT;
BEGIN
    SELECT COALESCE(sale_prefix, 'SALE') INTO prefix FROM settings LIMIT 1;
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 INTO next_num FROM sales;
    sale_no := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN sale_no;
END;
$$ LANGUAGE plpgsql;

-- 16. FUNCTION TO GENERATE RECEIPT NUMBER
CREATE OR REPLACE FUNCTION generate_receipt_no()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    receipt_no TEXT;
BEGIN
    SELECT COALESCE(receipt_prefix, 'RCP') INTO prefix FROM settings LIMIT 1;
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 INTO next_num FROM sale_payments;
    receipt_no := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN receipt_no;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE sale_payment_schedules IS 'Payment schedule/installment plan for each sale';
COMMENT ON TABLE sale_payments IS 'Actual payment collections with money receipts';
COMMENT ON TABLE sale_documents IS 'Documents attached to sales (agreements, ID copies, etc.)';
COMMENT ON TABLE sale_activities IS 'Audit trail for all sale-related activities';
COMMENT ON TABLE notification_logs IS 'Log of all SMS/Email notifications sent';
COMMENT ON TABLE sms_templates IS 'Templates for automated SMS messages';
