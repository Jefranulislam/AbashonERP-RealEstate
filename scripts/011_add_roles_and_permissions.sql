-- =====================================================
-- Role-Based Access Control (RBAC) System
-- Migration Script: 011_add_roles_and_permissions.sql
-- =====================================================

-- ===== 1. ROLES TABLE =====
-- Stores all available roles in the system
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_role_name ON roles(role_name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- ===== 2. MODULES TABLE =====
-- Stores all modules/features in the system
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_module_id INTEGER REFERENCES modules(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_modules_module_name ON modules(module_name);
CREATE INDEX IF NOT EXISTS idx_modules_parent_module_id ON modules(parent_module_id);

-- ===== 3. PERMISSIONS TABLE =====
-- Stores granular permissions (CRUD operations)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_permission_name ON permissions(permission_name);

-- ===== 4. ROLE PERMISSIONS TABLE =====
-- Maps roles to module permissions (many-to-many relationship)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, module_id, permission_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON role_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ===== 5. UPDATE EMPLOYEES TABLE =====
-- Add role_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);

-- ===== 6. UPDATE USERS TABLE =====
-- Add role_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ===== 7. INSERT DEFAULT PERMISSIONS =====
INSERT INTO permissions (permission_name, description) VALUES
    ('module_show', 'Can view the module'),
    ('show', 'Can view records'),
    ('create', 'Can create new records'),
    ('edit', 'Can edit existing records'),
    ('delete', 'Can delete records'),
    ('pdf', 'Can generate PDF'),
    ('trash_show', 'Can view deleted/trash records'),
    ('restore', 'Can restore deleted records'),
    ('permanently_delete', 'Can permanently delete records')
ON CONFLICT (permission_name) DO NOTHING;

-- ===== 8. INSERT DEFAULT MODULES =====
-- Based on the admin access CSV provided
INSERT INTO modules (module_name, display_name, description, sort_order) VALUES
    ('user', 'User', 'User management', 1),
    ('role_manager', 'Role Manager', 'Role and permission management', 2),
    ('settings', 'Settings', 'System settings', 3),
    ('branch', 'Branch', 'Branch management', 4),
    ('ledger_type', 'Ledger Type', 'Ledger type management', 5),
    ('ledger_group', 'Ledger Group', 'Ledger group management', 6),
    ('ledger_name', 'Ledger Name', 'Ledger name management', 7),
    ('bank_cash', 'Bank Cash', 'Bank and cash management', 8),
    ('initial_income_expense_head_balance', 'Initial Income Expense Head Balance', 'Initial balance management', 9),
    ('initial_bank_cash_balance', 'Initial Bank Cash Balance', 'Initial bank cash balance', 10),
    ('dr_voucher', 'Dr Voucher', 'Debit voucher management', 11),
    ('cr_voucher', 'Cr Voucher', 'Credit voucher management', 12),
    ('jnl_voucher', 'Jnl Voucher', 'Journal voucher management', 13),
    ('contra_voucher', 'Contra Voucher', 'Contra voucher management', 14),
    ('ledger', 'Ledger', 'Ledger management', 15),
    ('trial_balance', 'Trial Balance', 'Trial balance report', 16),
    ('cost_of_revenue', 'Cost Of Revenue', 'Cost of revenue report', 17),
    ('profit_or_loss_account', 'Profit Or Loss Account', 'Profit and loss account', 18),
    ('retained_earning', 'Retained Earning', 'Retained earning report', 19),
    ('fixed_assets_schedule', 'Fixed Assets Schedule', 'Fixed assets schedule', 20),
    ('statement_of_financial_position', 'Statement Of Financial Position', 'Balance sheet', 21),
    ('cash_flow', 'Cash Flow', 'Cash flow statement', 22),
    ('receive_and_payment', 'Receive And Payment', 'Receipt and payment report', 23),
    ('notes', 'Notes', 'Notes management', 24),
    ('general_branch_report', 'General Branch Report', 'General branch reports', 25),
    ('general_ledger_report', 'General Ledger Report', 'General ledger reports', 26),
    ('general_bank_cash_report', 'General Bank Cash Report', 'General bank cash reports', 27),
    ('general_voucher_report', 'General Voucher Report', 'General voucher reports', 28),
    ('employees', 'Employees', 'Employee management', 29),
    ('crm', 'CRM', 'Customer relationship management', 30),
    ('projects', 'Projects', 'Project management', 31),
    ('products', 'Products', 'Product management', 32),
    ('customers', 'Customers', 'Customer management', 33),
    ('vendors', 'Vendors', 'Vendor management', 34),
    ('constructors', 'Constructors', 'Constructor management', 35),
    ('sales', 'Sales', 'Sales management', 36),
    ('purchase', 'Purchase', 'Purchase management', 37),
    ('finance', 'Finance', 'Finance management', 38),
    ('cheques', 'Cheques', 'Cheque management', 39),
    ('advance_payables', 'Advance Payables', 'Advance payables management', 40),
    ('reports', 'Reports', 'Reporting module', 41)
ON CONFLICT (module_name) DO NOTHING;

-- ===== 9. INSERT DEFAULT ROLES =====
INSERT INTO roles (role_name, description) VALUES
    ('Admin', 'Full system access with all permissions'),
    ('Manager', 'Management level access'),
    ('Accountant', 'Accounting and finance access'),
    ('Sales Executive', 'Sales module access'),
    ('Purchase Officer', 'Purchase module access'),
    ('HR Manager', 'Human resources access'),
    ('Viewer', 'Read-only access to most modules')
ON CONFLICT (role_name) DO NOTHING;

-- ===== 10. INSERT ADMIN ROLE PERMISSIONS =====
-- Admin gets all permissions for all modules
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Admin'
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 11. INSERT MANAGER ROLE PERMISSIONS =====
-- Manager gets most permissions except permanently delete
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Manager'
    AND p.permission_name != 'permanently_delete'
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 12. INSERT ACCOUNTANT ROLE PERMISSIONS =====
-- Accountant gets full access to accounting modules
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Accountant'
    AND m.module_name IN (
        'ledger_type', 'ledger_group', 'ledger_name', 'bank_cash',
        'dr_voucher', 'cr_voucher', 'jnl_voucher', 'contra_voucher',
        'ledger', 'trial_balance', 'cost_of_revenue', 'profit_or_loss_account',
        'retained_earning', 'fixed_assets_schedule', 'statement_of_financial_position',
        'cash_flow', 'receive_and_payment', 'cheques', 'finance'
    )
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 13. INSERT SALES EXECUTIVE ROLE PERMISSIONS =====
-- Sales Executive gets access to sales-related modules
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Sales Executive'
    AND m.module_name IN (
        'crm', 'customers', 'sales', 'products', 'projects'
    )
    AND p.permission_name != 'permanently_delete'
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 14. INSERT PURCHASE OFFICER ROLE PERMISSIONS =====
-- Purchase Officer gets access to purchase-related modules
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Purchase Officer'
    AND m.module_name IN (
        'vendors', 'purchase', 'products', 'advance_payables', 'constructors'
    )
    AND p.permission_name != 'permanently_delete'
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 15. INSERT HR MANAGER ROLE PERMISSIONS =====
-- HR Manager gets access to employee-related modules
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'HR Manager'
    AND m.module_name IN (
        'employees', 'user', 'role_manager'
    )
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 16. INSERT VIEWER ROLE PERMISSIONS =====
-- Viewer gets only module_show and show permissions
INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
SELECT 
    r.id as role_id,
    m.id as module_id,
    p.id as permission_id,
    true as is_granted
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE r.role_name = 'Viewer'
    AND p.permission_name IN ('module_show', 'show')
ON CONFLICT (role_id, module_id, permission_id) DO NOTHING;

-- ===== 17. UPDATE ADMIN USER WITH ADMIN ROLE =====
-- Set the admin user to have the Admin role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_name = 'Admin' LIMIT 1)
WHERE email = 'admin@admin.com';

-- ===== 18. CREATE AUDIT LOG TABLE =====
-- Track permission changes for security auditing
CREATE TABLE IF NOT EXISTS role_permission_audit_log (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    module_id INTEGER REFERENCES modules(id),
    permission_id INTEGER REFERENCES permissions(id),
    action VARCHAR(50) NOT NULL, -- 'GRANTED', 'REVOKED', 'MODIFIED'
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_value BOOLEAN,
    new_value BOOLEAN,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_role_id ON role_permission_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON role_permission_audit_log(changed_at);

-- =====================================================
-- End of RBAC Migration Script
-- =====================================================
