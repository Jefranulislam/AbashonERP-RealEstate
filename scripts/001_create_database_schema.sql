-- CRM Module Tables
CREATE TABLE IF NOT EXISTS crm_leads (
    id SERIAL PRIMARY KEY,
    crm_id VARCHAR(50) UNIQUE NOT NULL,
    profession VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    leads_status VARCHAR(50),
    lead_source VARCHAR(50),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    nid VARCHAR(50),
    project_name VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assign_to INTEGER,
    assigned_by INTEGER,
    next_call_date DATE,
    last_call_date DATE,
    father_or_husband_name VARCHAR(255),
    mailing_address TEXT,
    permanent_address TEXT,
    birth_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Location Module
CREATE TABLE IF NOT EXISTS project_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Module
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_location_id INTEGER REFERENCES project_locations(id),
    address TEXT,
    facing VARCHAR(100),
    building_height VARCHAR(100),
    land_area VARCHAR(100),
    project_launching_date DATE,
    hand_over_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Module
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Module
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    profession VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    father_or_husband_name VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    nid VARCHAR(50),
    email VARCHAR(255),
    mailing_address TEXT,
    permanent_address TEXT,
    birth_date DATE,
    crm_id VARCHAR(50),
    assign_to_name VARCHAR(255),
    image_url TEXT,
    converted_from INTEGER REFERENCES crm_leads(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Module
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    mailing_address TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constructor Module
CREATE TABLE IF NOT EXISTS constructors (
    id SERIAL PRIMARY KEY,
    constructor_name VARCHAR(255) NOT NULL,
    mailing_address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Management Module
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    position VARCHAR(100),
    department VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Module
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    seller_id INTEGER REFERENCES employees(id),
    project_id INTEGER REFERENCES projects(id),
    product_id INTEGER REFERENCES products(id),
    sale_date DATE NOT NULL,
    amount DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income/Expense Type Module
CREATE TABLE IF NOT EXISTS income_expense_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income/Expense Head List Module
CREATE TABLE IF NOT EXISTS income_expense_heads (
    id SERIAL PRIMARY KEY,
    head_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    inc_exp_type_id INTEGER REFERENCES income_expense_types(id),
    type VARCHAR(10), -- 'Dr' or 'Cr'
    is_stock BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Requisition Module
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id SERIAL PRIMARY KEY,
    mpr_no VARCHAR(50) UNIQUE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    employee_id INTEGER REFERENCES employees(id),
    purpose_description TEXT,
    requisition_date DATE NOT NULL,
    required_date DATE,
    comments TEXT,
    contact_person VARCHAR(255),
    nb TEXT,
    remark TEXT,
    total_amount DECIMAL(15, 2),
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Requisition Items
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    description TEXT,
    qty DECIMAL(10, 2),
    rate DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank & Cash Module
CREATE TABLE IF NOT EXISTS bank_cash_accounts (
    id SERIAL PRIMARY KEY,
    account_title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Bank Cash Module
CREATE TABLE IF NOT EXISTS initial_bank_cash (
    id SERIAL PRIMARY KEY,
    bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
    initial_balance DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Expense Head Module
CREATE TABLE IF NOT EXISTS initial_expense_heads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    initial_balance DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounting Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    voucher_type VARCHAR(20) NOT NULL, -- 'Credit', 'Debit', 'Journal', 'Contra'
    project_id INTEGER REFERENCES projects(id),
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
    bill_no VARCHAR(50),
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    particulars TEXT,
    cheque_number VARCHAR(50),
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Voucher Details (for double entry)
CREATE TABLE IF NOT EXISTS journal_voucher_details (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER REFERENCES vouchers(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assign Constructor Sub Module
CREATE TABLE IF NOT EXISTS assigned_constructors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    constructor_id INTEGER REFERENCES constructors(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advance/Payable Module
CREATE TABLE IF NOT EXISTS advance_payables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    vendor_id INTEGER REFERENCES vendors(id),
    constructor_id INTEGER REFERENCES constructors(id),
    amount DECIMAL(15, 2),
    payment_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cheque Manager Module
CREATE TABLE IF NOT EXISTS cheques (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    bank_name VARCHAR(255),
    cheque_number VARCHAR(50) NOT NULL,
    cheque_amount DECIMAL(15, 2) NOT NULL,
    cheque_date DATE NOT NULL,
    submitted_date DATE,
    is_submitted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Module
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    payment_methods TEXT, -- Comma separated
    invoice_prefix VARCHAR(20),
    invoice_terms TEXT,
    lead_status TEXT, -- Comma separated
    lead_source TEXT, -- Comma separated
    print_on_company_pad BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (company_name, invoice_prefix, lead_status, lead_source)
VALUES (
    'Anzac Design and Development Ltd',
    'ADDL',
    'Positive,Negative,Junk,Followup,Client will Visit,New',
    'Self,Facebook,Youtube,Personal Contact,Friend'
) ON CONFLICT DO NOTHING;

-- User Management Module (extends neon_auth.users_sync)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES neon_auth.users_sync(id),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(leads_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assign_to ON crm_leads(assign_to);
CREATE INDEX IF NOT EXISTS idx_customers_crm_id ON customers(crm_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_project_id ON sales(project_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_project_id ON vouchers(project_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_project_id ON purchase_requisitions(project_id);
