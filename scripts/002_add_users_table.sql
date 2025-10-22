-- Add users table if not using Neon Auth
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Insert a default admin user (password: admin123)
-- In production, you should hash the password properly
INSERT INTO users (email, name, password_hash)
VALUES ('admin@admin.com', 'Admin', '$2a$10$8K1p/a0dL3LKzjIqvx0qcu5pqiPMZ5MzZlCsW5ZgO0K9Lq9JiH1hO')
ON CONFLICT (email) DO NOTHING;

-- Update user_permissions to reference the users table
DROP TABLE IF EXISTS user_permissions CASCADE;

CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    phone VARCHAR(20),
    category VARCHAR(50),
    -- Module permissions
    can_access_project BOOLEAN DEFAULT false,
    can_access_project_location BOOLEAN DEFAULT false,
    can_access_products BOOLEAN DEFAULT false,
    can_access_vendor BOOLEAN DEFAULT false,
    can_access_constructor BOOLEAN DEFAULT false,
    can_access_advance_payable BOOLEAN DEFAULT false,
    can_access_sales BOOLEAN DEFAULT false,
    can_access_purchase_requisition BOOLEAN DEFAULT false,
    can_access_purchase_confirm BOOLEAN DEFAULT false,
    can_access_purchase_order BOOLEAN DEFAULT false,
    can_access_customer BOOLEAN DEFAULT false,
    can_access_employee_list BOOLEAN DEFAULT false,
    can_access_income_expense_type BOOLEAN DEFAULT false,
    can_access_income_expense_head BOOLEAN DEFAULT false,
    can_access_income_expense_head_balance BOOLEAN DEFAULT false,
    can_access_check_manager BOOLEAN DEFAULT false,
    can_access_client_information BOOLEAN DEFAULT false,
    can_access_bank_cash BOOLEAN DEFAULT false,
    can_access_initial_bank_cash BOOLEAN DEFAULT false,
    can_access_transaction BOOLEAN DEFAULT false,
    can_access_purchase_report BOOLEAN DEFAULT false,
    can_access_sales_report BOOLEAN DEFAULT false,
    can_access_settings BOOLEAN DEFAULT false,
    can_access_users BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant all permissions to admin user
INSERT INTO user_permissions (
    user_id, 
    can_access_project, can_access_project_location, can_access_products,
    can_access_vendor, can_access_constructor, can_access_advance_payable,
    can_access_sales, can_access_purchase_requisition, can_access_purchase_confirm,
    can_access_purchase_order, can_access_customer, can_access_employee_list,
    can_access_income_expense_type, can_access_income_expense_head,
    can_access_income_expense_head_balance, can_access_check_manager,
    can_access_client_information, can_access_bank_cash, can_access_initial_bank_cash,
    can_access_transaction, can_access_purchase_report, can_access_sales_report,
    can_access_settings, can_access_users
)
SELECT 
    id,
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true
FROM users
WHERE email = 'admin@admin.com'
ON CONFLICT DO NOTHING;
