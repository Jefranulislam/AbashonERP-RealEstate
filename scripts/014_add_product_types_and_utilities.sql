-- =====================================================
-- PRODUCT TYPES, UTILITIES & DYNAMIC PAYMENT PLAN
-- Enhancement for Real Estate ERP
-- =====================================================

-- 1. ADD PRODUCT TYPES TO SETTINGS
ALTER TABLE settings ADD COLUMN IF NOT EXISTS product_types TEXT DEFAULT 'Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others';

-- 2. ENHANCE PRODUCTS TABLE WITH UTILITY CHARGES AND RATE
ALTER TABLE products ADD COLUMN IF NOT EXISTS rate_per_sqft DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS utility_charge DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size DECIMAL(10, 2); -- size in sqft
ALTER TABLE products ADD COLUMN IF NOT EXISTS calculated_price DECIMAL(15, 2); -- rate * size + utility
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(100); -- Residential, Commercial, Parking, Gas Line, etc.
ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(15, 2); -- base price or final price

-- Update existing base_price to use calculated_price if needed
UPDATE products SET calculated_price = base_price WHERE calculated_price IS NULL AND base_price IS NOT NULL;

-- 3. ADD ADDITIONAL PRODUCTS/ITEMS TO SALES (Parking, Gas Line, etc.)
CREATE TABLE IF NOT EXISTS sale_additional_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    item_type VARCHAR(50) NOT NULL, -- 'parking', 'gas_line', 'utility', 'other'
    item_name VARCHAR(255),
    description TEXT,
    base_price DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    net_price DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for additional items
CREATE INDEX IF NOT EXISTS idx_sale_additional_items_sale_id ON sale_additional_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_additional_items_type ON sale_additional_items(item_type);

-- 4. ENHANCE SALES TABLE FOR TOTAL CALCULATIONS
ALTER TABLE sales ADD COLUMN IF NOT EXISTS flat_price DECIMAL(15, 2); -- Price of main flat/unit
ALTER TABLE sales ADD COLUMN IF NOT EXISTS utility_charge DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS parking_total DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gas_line_total DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS other_charges DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_gross_price DECIMAL(15, 2); -- Sum of all before discount

-- 5. DYNAMIC PAYMENT SCHEDULE ENHANCEMENT
-- Add custom payment type support
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS payment_label VARCHAR(255); -- "1st Installment", "40% Payment", etc.
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS percentage DECIMAL(5, 2); -- Payment as percentage of total
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS due_month INTEGER; -- Month number (1-12)
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS due_year INTEGER; -- Year (e.g., 2024)
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false; -- Custom installment vs auto-generated
ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0; -- For ordering

-- 6. VIEW FOR PRODUCTS WITH CALCULATED PRICES
CREATE OR REPLACE VIEW products_with_prices AS
SELECT 
    p.*,
    pr.project_name,
    COALESCE(p.rate_per_sqft * p.size + p.utility_charge, p.base_price, p.price) as total_price
FROM products p
LEFT JOIN projects pr ON p.project_id = pr.id
WHERE p.is_active = true;

-- 7. VIEW FOR SALE WITH ALL ITEMS
CREATE OR REPLACE VIEW sale_complete AS
SELECT 
    s.*,
    c.customer_name,
    c.phone as customer_phone,
    pr.project_name,
    p.product_name,
    p.unit_no,
    p.floor_no,
    e.name as seller_name,
    COALESCE(
        (SELECT SUM(net_price) FROM sale_additional_items WHERE sale_id = s.id AND is_active = true),
        0
    ) as additional_items_total,
    (SELECT COUNT(*) FROM sale_additional_items WHERE sale_id = s.id AND is_active = true) as additional_items_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN projects pr ON s.project_id = pr.id
LEFT JOIN products p ON s.product_id = p.id
LEFT JOIN employees e ON s.seller_id = e.id
WHERE s.is_active = true;

COMMENT ON TABLE sale_additional_items IS 'Additional items like parking, gas line attached to main sale';
COMMENT ON COLUMN products.rate_per_sqft IS 'Rate per square foot for calculating total price';
COMMENT ON COLUMN products.utility_charge IS 'Utility connection/installation charge';
COMMENT ON COLUMN products.calculated_price IS 'Auto-calculated: rate * size + utility';
COMMENT ON COLUMN sale_payment_schedules.is_custom IS 'True if manually added, False if auto-generated';
