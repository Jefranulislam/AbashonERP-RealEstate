# ABASHON ERP - Product Requirements Document & Technical Blueprint

**Project Name:** Abashon ERP - Real Estate
**Version:** 0.1.0  
**Created Date:** May 30, 2026
**Authors:** Jefranul Islam & FAHIS

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Core Modules & Features](#core-modules--features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Business Logic & Calculations](#business-logic--calculations)
8. [Authentication & Authorization](#authentication--authorization)
9. [UI Components](#ui-components)
10. [Utilities & Helper Functions](#utilities--helper-functions)
11. [Configuration & Deployment](#configuration--deployment)

---

## Executive Summary

**Abashon ERP** is a comprehensive, modular Enterprise Resource Planning system tailored specifically for **real estate businesses** (small to medium enterprises). The system provides integrated solutions for:

- **Customer Relationship Management (CRM)**: Lead management, customer tracking, pipeline management
- **Sales & Booking Management**: Unit/flat/plot booking, payment schedules, handover tracking
- **Accounting & Finance**: Multi-type vouchers, ledger management, financial reporting
- **Purchase Management**: Purchase orders, material tracking, vendor management, payment schedules
- **Project Management**: Project locations, product inventory, resource allocation
- **Role-Based Access Control (RBAC)**: Granular permission system with 7+ default roles
- **Reporting**: Financial statements, sales reports, stock reports, ledger reports

**Tech Stack:**
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes (Node.js)
- **Database:** PostgreSQL (Neon serverless)
- **ORM/Query:** Raw SQL with Neon tagged templates
- **State Management:** React Query (TanStack), Zustand
- **Forms:** React Hook Form + Zod validation
- **Deployment:** Vercel
- **Live Demo:** https://abashon-erp-real-estate.vercel.app/

---

## Project Overview

### Business Context

The ERP is built for real estate companies managing:
- Multi-project operations
- Complex sales workflows (booking → agreement → construction → handover)
- Financial tracking across projects
- Vendor and material management
- Automated notifications (SMS, email)
- Multi-user access with role-based permissions

### Key Statistics
- **11+ SQL migration files** defining database schema
- **30+ API route files** for business operations
- **40+ permission types** for fine-grained access control
- **8+ voucher-related utilities** for accounting
- **7 default roles** with predefined permissions
- **Multiple data import templates** for bulk operations

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ABASHON ERP Frontend                         │
│                   (Next.js 16 React 19 App)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ UI Components (Radix, Tailwind, Lucide Icons)           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Forms (React Hook Form + Zod Validation)                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ State Management (React Query + Zustand)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/REST
        ┌────────────────────┴────────────────────┐
        │   Next.js API Routes (Backend)          │
        │ ┌──────────────────────────────────────┐│
        │ │ /api/auth          - Authentication  ││
        │ │ /api/vouchers      - Accounting      ││
        │ │ /api/sales-v2      - Sales/Booking   ││
        │ │ /api/customers     - CRM             ││
        │ │ /api/purchase      - Procurement     ││
        │ │ /api/vendors       - Vendor Mgmt     ││
        │ │ /api/projects      - Projects        ││
        │ │ /api/reports       - Reporting       ││
        │ │ /api/users         - User Mgmt       ││
        │ │ /api/roles         - RBAC            ││
        │ └──────────────────────────────────────┘│
        └────────────────────┬────────────────────┘
                             │ SQL Queries
        ┌────────────────────┴────────────────────┐
        │  PostgreSQL Database (Neon Serverless)  │
        │  ┌──────────────────────────────────────┐│
        │  │ Tables: 40+ (CRM, Accounting, Sales) ││
        │  │ Indexes: Performance optimized       ││
        │  │ Triggers: Business logic automation  ││
        │  └──────────────────────────────────────┘│
        └─────────────────────────────────────────┘
```

### Application Structure

```
New KH ERP/
├── app/
│   ├── layout.tsx                    # Root layout with theme provider
│   ├── login/                        # Authentication pages
│   ├── (main)/                       # Protected routes layout
│   │   ├── dashboard/                # Dashboard page
│   │   ├── crm/                      # CRM pages
│   │   ├── sales/                    # Sales pages
│   │   ├── accounting/               # Accounting pages
│   │   ├── purchase/                 # Purchase pages
│   │   ├── reports/                  # Reporting pages
│   │   └── settings/                 # Settings pages
│   ├── api/
│   │   ├── auth/                     # Authentication routes
│   │   ├── vouchers/                 # Accounting routes
│   │   ├── sales-v2/                 # Sales routes
│   │   ├── customers/                # CRM routes
│   │   ├── purchase/                 # Purchase routes
│   │   ├── vendors/                  # Vendor routes
│   │   ├── projects/                 # Project routes
│   │   ├── reports/                  # Reporting routes
│   │   ├── users/                    # User management
│   │   ├── roles/                    # RBAC routes
│   │   └── imports/                  # Data import routes
│   ├── globals.css                   # Global styles
│   └── login/                        # Login page
├── components/
│   ├── ui/                           # Radix UI primitive components
│   ├── app-sidebar.tsx               # App navigation sidebar
│   ├── transaction-form.tsx          # Generic transaction form
│   ├── po-form.tsx                   # Purchase order form
│   ├── journal-voucher.tsx           # Journal entry form
│   ├── cash-memo.tsx                 # Cash memo template
│   ├── customer-receipt.tsx          # Receipt template
│   ├── booking-stepper.tsx           # Sales booking wizard
│   ├── dynamic-payment-plan.tsx      # Payment schedule builder
│   ├── pdf-template.tsx              # PDF export template
│   ├── crm/                          # CRM components
│   └── pdf/                          # PDF generation components
├── lib/
│   ├── db.ts                         # Database connection
│   ├── auth.ts                       # Authentication logic
│   ├── permissions.ts                # Permission system
│   ├── account-code.ts               # Accounting code generator
│   ├── admin-access.ts               # Admin access check
│   ├── payment-utils.ts              # Payment utilities
│   ├── po-calculations.ts            # PO calculation engine
│   ├── voucher-utils.ts              # Voucher utilities
│   ├── pdf-utils.ts                  # PDF generation utilities
│   ├── vendor-code.ts                # Vendor code generator
│   ├── reference-party.ts            # Reference party lookup
│   ├── sms-service.ts                # SMS integration
│   ├── import-templates.ts           # Import template manager
│   ├── validations/
│   │   ├── accounting.ts             # Accounting validations
│   │   ├── crm.ts                    # CRM validations
│   │   └── finance.ts                # Finance validations
│   ├── hooks/
│   │   ├── use-accounting.ts         # Accounting queries/mutations
│   │   ├── use-crm.ts                # CRM queries/mutations
│   │   └── use-*                     # Other domain hooks
│   ├── stores/
│   │   └── ui-store.ts               # UI state (Zustand)
│   └── providers/
│       └── ThemeProvider             # Theme configuration
├── scripts/
│   ├── 001_create_database_schema.sql
│   ├── 002_add_accounting_fields.sql
│   ├── 003_add_performance_indexes.sql
│   ├── ...
│   └── normalize-voucher-numbers.ts
├── public/
│   └── uploads/                      # User-uploaded files
├── middleware.ts                     # Request authentication middleware
├── middleware-permissions.ts         # Permission checking middleware
├── next.config.mjs                   # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
└── vitest.config.ts                  # Test configuration
```

---

## Core Modules & Features

### 1. Authentication & Authorization Module

**Purpose:** Secure access control with session management and role-based permissions

#### Features:
- **Session-based authentication** (cookie-stored user ID)
- **Role-based access control (RBAC)** with 7 default roles
- **Fine-grained permissions** (9 permission types per module)
- **Middleware protection** for authenticated routes
- **Dynamic permission checking** at route and component level

#### Authentication Flow:
```
1. User enters credentials at /login
2. Backend validates against users table
3. Sets session cookie with userId
4. Middleware validates session on protected routes
5. Permission system checks module/action access
```

#### Roles (Default):
| Role | Access Level | Key Modules |
|------|--------------|-------------|
| **Admin** | Full system | All modules, all permissions |
| **Manager** | Management | Most modules except permanently_delete |
| **Accountant** | Accounting focused | Ledger, vouchers, reports, finance |
| **Sales Executive** | Sales only | Sales, customers, products, reports |
| **Purchase Officer** | Procurement | Purchase, vendors, finance |
| **HR Manager** | HR operations | Employees, settings |
| **Viewer** | Read-only | Read access to most modules |

#### Permission Types:
- `module_show` - View module
- `show` - View records
- `create` - Create records
- `edit` - Edit records
- `delete` - Soft delete records
- `pdf` - Generate PDF
- `trash_show` - View deleted records
- `restore` - Restore soft-deleted records
- `permanently_delete` - Hard delete records

#### Key Functions:
```typescript
// Get user permissions grouped by module
async function getUserPermissions(userId: string): Promise<UserPermissions>

// Check specific permission
async function hasPermission(userId, moduleName, permissionName): Promise<boolean>

// Check module access
async function canAccessModule(userId, moduleName): Promise<boolean>

// Get current authenticated user
async function getCurrentUser(): Promise<User | null>
```

---

### 2. Accounting & Vouchers Module

**Purpose:** Complete double-entry bookkeeping system with multiple voucher types

#### Features:
- **4 voucher types**: Credit (income), Debit (expense), Journal (transfer), Contra (bank-to-bank)
- **Multi-project accounting** with project-level ledgers
- **Account code system** with 4-digit hierarchical codes
- **Automatic voucher numbering** with prefixes and year
- **Complete audit trail** with created_at, updated_at, deleted_at
- **Ledger reports** with balance tracking
- **PDF generation** for all voucher types

#### Voucher Types & Prefixes:
| Type | Prefix | Example | Usage |
|------|--------|---------|-------|
| **Credit** | CR | CR-2025-0001 | Income/receipt entries |
| **Debit** | DV | DV-2025-0052 | Expense/payment entries |
| **Journal** | JV | JV-2025-0010 | Internal transfers |
| **Contra** | CV | CV-2025-0003 | Bank-to-bank transfers |

#### Accounting Tables:
```sql
-- Core Voucher Table
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    voucher_no VARCHAR(50) UNIQUE,
    voucher_type VARCHAR(20), -- 'Credit', 'Debit', 'Journal', 'Contra'
    project_id INTEGER REFERENCES projects(id),
    date DATE,
    particulars TEXT,
    amount DECIMAL(15,2),
    is_confirmed BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete
);

-- Ledger System (Chart of Accounts)
CREATE TABLE income_expense_heads (
    id SERIAL PRIMARY KEY,
    head_name VARCHAR(255),
    head_type VARCHAR(50), -- 'Income', 'Expense', 'Asset', 'Liability', 'Equity'
    account_code VARCHAR(4) UNIQUE, -- 4-digit code
    is_group BOOLEAN,
    parent_id INTEGER REFERENCES income_expense_heads(id),
    full_path TEXT, -- Hierarchical path
    level INTEGER, -- Depth in hierarchy
    is_active BOOLEAN
);

-- Bank/Cash Accounts
CREATE TABLE bank_cash_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(255),
    account_type VARCHAR(50), -- 'Bank', 'Cash'
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    balance DECIMAL(15,2),
    is_active BOOLEAN
);
```

#### Key Business Logic:
```typescript
// Normalize voucher type (handles multiple formats)
function normalizeVoucherType(type: string): VoucherType
// E.g., 'credit', 'CR', 'cr' → 'Credit'

// Generate voucher number with automatic serial
function buildVoucherNo(type: string, serial: number, year?: number): string
// E.g., 'CR-2025-0001'

// Get next available account code
async function getNextAccountCode(): Promise<string>

// Calculate amounts in words (Bengali numerals)
function amountToWordsBDT(amount: number): string
// E.g., 1000 → "one thousand taka only"
```

#### Validation Rules (Zod Schemas):
```typescript
// Credit Voucher: Single-entry income recording
creditVoucherSchema = {
    date: string (required),
    projectId: number (required),
    expenseHeadId: number (required), // Debit account
    bankCashId: number (required), // Credit account
    amount: number > 0 (required),
    billNo?: string,
    particulars?: string
}

// Debit Voucher: Single-entry expense recording
debitVoucherSchema = {
    date: string (required),
    projectId: number (required),
    expenseHeadId: number (required), // Credit account
    bankCashId: number (required), // Debit account
    amount: number > 0 (required)
}

// Journal Voucher: Dual-entry transfer
journalVoucherSchema = {
    drProjectId: number (required),
    drExpenseHeadId: number (required),
    drAmount: number > 0 (required),
    crProjectId: number (required),
    crExpenseHeadId: number (required),
    crAmount: number > 0 (required)
} + Validation: drAmount === crAmount

// Contra Voucher: Bank-to-bank transfer
contraVoucherSchema = {
    projectId: number (required),
    drBankCashId: number (required),
    crBankCashId: number (required),
    amount: number > 0 (required),
    chequeNumber?: string
} + Validation: drBankCashId !== crBankCashId
```

#### Financial Reporting:
- **Ledger Report** - Account-wise balance sheet
- **Trial Balance** - Debit/Credit summary
- **Profit & Loss Account** - Revenue vs expenses
- **Cash Flow Statement** - Cash movements
- **Fixed Assets Schedule** - Asset tracking
- **Statement of Financial Position** - Balance sheet

---

### 3. Sales & Booking Management Module

**Purpose:** Complete real estate sales lifecycle from booking to handover

#### Features:
- **Booking management** with multiple payment plans
- **Payment scheduling** with milestone-based tracking
- **Handover tracking** and completion
- **Automatic SMS/Email notifications** to customers
- **Document management** (agreements, NIDs, photos)
- **Commission tracking** for sales agents
- **Activity audit trail** for all changes

#### Sales Workflow:
```
1. Create Booking
   ├─ Select customer, unit, project
   ├─ Set base price and discounts
   ├─ Choose payment plan (full, installment, milestone)
   └─ Generate booking no, set booking date

2. Payment Schedule
   ├─ Create payment milestones
   ├─ Set due dates
   ├─ Allocate amounts
   └─ Track payment status

3. Payment Collection
   ├─ Record payment receipt
   ├─ Validate cheque/bank details
   ├─ Auto-create accounting voucher
   └─ Send SMS confirmation to customer

4. Document Management
   ├─ Upload agreement
   ├─ Attach NID copies
   ├─ Store payment receipts
   └─ Keep photos

5. Handover
   ├─ Mark handover date
   ├─ Generate final receipt
   ├─ Archive documents
   └─ Send handover notification
```

#### Sales Database Tables:
```sql
-- Sales Master
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_no VARCHAR(50) UNIQUE,
    sale_type VARCHAR(30), -- 'booking', 'direct_sale'
    sale_status VARCHAR(30), -- 'booked', 'agreement_signed', 'in_progress', 'completed', 'handed_over'
    
    -- Customer & Unit
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Pricing
    base_price DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    net_price DECIMAL(15,2),
    booking_amount DECIMAL(15,2), -- Token money
    down_payment DECIMAL(15,2),
    total_paid DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2),
    
    -- Payment Terms
    payment_plan VARCHAR(50), -- 'full', 'installment', 'milestone'
    installment_count INTEGER,
    installment_amount DECIMAL(15,2),
    
    -- Dates
    booking_date DATE,
    agreement_date DATE,
    expected_handover_date DATE,
    actual_handover_date DATE,
    
    -- Nominee (Co-applicant)
    nominee_name VARCHAR(255),
    nominee_phone VARCHAR(20),
    nominee_nid VARCHAR(50),
    
    -- Commission
    reference_by VARCHAR(255),
    commission_amount DECIMAL(15,2),
    commission_paid BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Payment Schedules
CREATE TABLE sale_payment_schedules (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    schedule_type VARCHAR(30), -- 'booking', 'down_payment', 'installment', 'milestone', 'handover'
    installment_no INTEGER,
    due_date DATE,
    amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2),
    status VARCHAR(20) -- 'pending', 'partial', 'paid', 'overdue'
);

-- Payment Collection
CREATE TABLE sale_payments (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE,
    sale_id INTEGER REFERENCES sales(id),
    payment_date DATE,
    amount DECIMAL(15,2),
    payment_method VARCHAR(30), -- 'cash', 'cheque', 'bank_transfer', 'online'
    cheque_number VARCHAR(50),
    cheque_date DATE,
    status VARCHAR(20), -- 'received', 'deposited', 'cleared', 'bounced'
    voucher_id INTEGER REFERENCES vouchers(id),
    created_at TIMESTAMP
);

-- Sale Documents
CREATE TABLE sale_documents (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    document_type VARCHAR(50), -- 'booking_form', 'agreement', 'nid_copy', 'photo', 'receipt'
    document_name VARCHAR(255),
    document_url TEXT,
    uploaded_by INTEGER REFERENCES employees(id)
);

-- Activity Audit Trail
CREATE TABLE sale_activities (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    activity_type VARCHAR(50), -- 'created', 'status_changed', 'payment_received', 'document_uploaded'
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP
);
```

#### Payment Plan Calculations:
```typescript
interface DynamicPaymentPlan {
    schedule_type: string;
    percentage: number;
    description: string;
    due_offset_days?: number;
}

// Calculate payment schedule items
function calculatePaymentSchedule(
    totalAmount: number,
    paymentPlan: string, // 'full', 'installment', 'milestone'
    installmentCount?: number,
    customSchedule?: DynamicPaymentPlan[]
): PaymentScheduleItem[]

// Validate payment is complete
function isPaymentComplete(sale: Sale): boolean {
    return sale.total_paid >= sale.net_price
}
```

#### SMS Notification Templates:
```
1. Booking Confirmation:
   "Dear {{customer_name}}, Your booking for {{unit_name}} at {{project_name}} 
    is confirmed. Booking No: {{sale_no}}. Total: {{net_price}}."

2. Payment Received:
   "Dear {{customer_name}}, We received {{amount}} for {{unit_name}}. 
    Receipt: {{receipt_no}}. Outstanding: {{outstanding}}."

3. Payment Reminder:
   "Reminder: Payment of {{amount}} for {{unit_name}} is due on {{due_date}}."

4. Handover Notice:
   "Congratulations! Your {{unit_name}} at {{project_name}} is ready for handover."
```

---

### 4. Purchase Management Module

**Purpose:** Complete procurement workflow from requisition to payment

#### Features:
- **Purchase requisition** creation and tracking
- **Purchase order generation** from requisitions
- **Multiple vendor support** with ratings
- **Material delivery tracking** with quality checks
- **Payment schedule management** with milestone tracking
- **Advance payment handling** with reconciliation
- **Material receiving** with quantity verification

#### Purchase Workflow:
```
1. Create Purchase Requisition
   ├─ Define material types (Sand, Steel, Cement, etc.)
   ├─ Set specifications and quality requirements
   ├─ Assign to vendor
   ├─ Set delivery location
   └─ Mark urgency level

2. Convert to Purchase Order
   ├─ Select vendor
   ├─ Add line items with quantities and rates
   ├─ Calculate totals with discount & tax
   ├─ Set payment terms (e.g., 30% advance, 50% on delivery, 20% after 15 days)
   └─ Get approval

3. Material Delivery
   ├─ Track vehicle and driver info
   ├─ Record received quantity
   ├─ Perform quality check
   ├─ Compare with PO quantity
   ├─ Update stock/inventory
   └─ Generate delivery receipt

4. Payment Processing
   ├─ Check payment schedule conditions
   ├─ Verify delivery/quality milestones
   ├─ Create accounting voucher
   ├─ Record payment
   └─ Update PO payment status
```

#### Purchase Database Tables:
```sql
-- Purchase Requisition
CREATE TABLE purchase_requisitions (
    id SERIAL PRIMARY KEY,
    req_number VARCHAR(50) UNIQUE,
    project_id INTEGER REFERENCES projects(id),
    requisition_date DATE,
    status VARCHAR(50), -- 'Draft', 'Submitted', 'Approved', 'Rejected'
    description TEXT
);

-- Requisition Items
CREATE TABLE purchase_requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase_requisitions(id),
    material_type VARCHAR(100), -- Sand, Steel, Cement, Bricks
    material_specification TEXT, -- Grade, Size, Quality, Brand
    qty DECIMAL(10,2),
    unit_of_measurement VARCHAR(50), -- CFT, KG, TON, BAG, PIECE
    vendor_id INTEGER REFERENCES vendors(id),
    delivery_location TEXT,
    urgency_level VARCHAR(20) -- Normal, Urgent, Critical
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE,
    requisition_id INTEGER REFERENCES purchase_requisitions(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    order_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial Details
    subtotal DECIMAL(15,2),
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    tax_percentage DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    -- Terms
    payment_terms TEXT, -- "30% Advance, 50% on Delivery, 20% after 15 days"
    delivery_terms TEXT,
    status VARCHAR(50), -- 'Draft', 'Sent', 'Acknowledged', 'In Progress', 'Completed'
    
    prepared_by INTEGER REFERENCES employees(id),
    approved_by INTEGER REFERENCES employees(id),
    approval_date DATE
);

-- PO Line Items
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id),
    material_type VARCHAR(100),
    material_specification TEXT,
    qty DECIMAL(10,2),
    unit_of_measurement VARCHAR(50),
    rate DECIMAL(15,2),
    amount DECIMAL(15,2),
    
    -- Delivery Tracking
    delivered_qty DECIMAL(10,2),
    accepted_qty DECIMAL(10,2),
    rejected_qty DECIMAL(10,2),
    remaining_qty DECIMAL(10,2)
);

-- Material Deliveries
CREATE TABLE material_deliveries (
    id SERIAL PRIMARY KEY,
    delivery_number VARCHAR(50) UNIQUE,
    po_id INTEGER REFERENCES purchase_orders(id),
    vendor_id INTEGER REFERENCES vendors(id),
    delivery_date DATE,
    delivery_slip_number VARCHAR(100),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),
    
    -- Receipt
    received_by INTEGER REFERENCES employees(id),
    received_date DATE,
    
    -- Material Details
    ordered_qty DECIMAL(10,2),
    delivered_qty DECIMAL(10,2),
    accepted_qty DECIMAL(10,2),
    rejected_qty DECIMAL(10,2),
    shortage_qty DECIMAL(10,2),
    
    -- Quality
    quality_status VARCHAR(50), -- 'Pending', 'Passed', 'Failed', 'Partial'
    quality_checked_by INTEGER REFERENCES employees(id),
    quality_remarks TEXT,
    
    delivery_status VARCHAR(50), -- 'Pending', 'In Transit', 'Received', 'Inspected', 'Accepted'
    storage_location TEXT
);

-- Payment Schedules
CREATE TABLE payment_schedules (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id),
    schedule_number VARCHAR(50),
    payment_type VARCHAR(50), -- 'Advance', 'On Delivery', 'After Inspection'
    payment_percentage DECIMAL(5,2),
    scheduled_amount DECIMAL(15,2),
    due_date DATE,
    status VARCHAR(50), -- 'Pending', 'Paid', 'Overdue'
    paid_amount DECIMAL(15,2),
    payment_condition TEXT,
    condition_met BOOLEAN
);
```

#### PO Calculation Engine:
```typescript
interface POLineItem {
    qty: number;
    rate: number;
    amount?: number;
}

interface POCalculation {
    qty: number;
    rate: number;
    lineAmount: number;
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
}

// Calculate line item
function calculateLineAmount(qty: number, rate: number): number
    return qty * rate;

// Calculate all totals
function calculatePOTotals(
    items: POLineItem[],
    discountPercentage?: number,
    taxPercentage?: number
): POCalculation {
    // 1. Subtotal = SUM(qty × rate) for all items
    // 2. Discount = subtotal × discount% / 100
    // 3. Taxable = subtotal - discount
    // 4. Tax = taxable × tax% / 100
    // 5. Total = taxable + tax
}

// Validate line item and PO
function validateLineItem(item: POLineItem): {
    valid: boolean;
    errors: string[];
}
```

#### Advance Payables Management:
```typescript
// Track advanced payments
interface AdvancePayable {
    id: number;
    vendor_id: number;
    po_id: number;
    advance_amount: DECIMAL(15,2);
    advance_date: DATE;
    status: string; // 'pending', 'reconciled', 'excess'
}

// Reconciliation Logic:
// 1. When PO is completed:
//    reconciled_amount = MIN(advance_paid, po_total)
// 2. If advance > po_total:
//    excess_amount = advance_paid - po_total (refund to vendor)
// 3. If advance < po_total:
//    remaining_amount = po_total - advance_paid (pay vendor)
```

---

### 5. CRM (Customer Relationship Management) Module

**Purpose:** Comprehensive lead and customer management

#### Features:
- **Lead management** with source tracking and assignment
- **Lead-to-customer conversion** with audit trail
- **Customer profiling** with detailed personal information
- **Lead assignment** to sales team members
- **Call tracking** with follow-up scheduling
- **Lead categorization** by status and source
- **Bulk lead import** from CSV files

#### CRM Workflow:
```
1. Create Lead
   ├─ Record personal info (name, email, phone, NID, etc.)
   ├─ Capture lead source (Website, Referral, Advertisement, etc.)
   ├─ Assign to sales person
   ├─ Set next call date
   └─ Mark as active/inactive

2. Lead Qualification
   ├─ Update lead status (New, Interested, Negotiating, Hot, Cold)
   ├─ Track call history
   ├─ Schedule follow-up calls
   ├─ Update notes and interactions
   └─ Identify ready-to-convert leads

3. Convert to Customer
   ├─ Generate customer ID
   ├─ Copy verified data from lead
   ├─ Create customer profile
   ├─ Link to projects/products
   ├─ Archive lead record
   └─ Begin sales process
```

#### CRM Database Tables:
```sql
-- CRM Leads
CREATE TABLE crm_leads (
    id SERIAL PRIMARY KEY,
    crm_id VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255),
    profession VARCHAR(100),
    leads_status VARCHAR(50), -- 'New', 'Interested', 'Negotiating', 'Hot', 'Cold'
    lead_source VARCHAR(50), -- 'Website', 'Referral', 'Advertisement', 'Cold Call', etc.
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    nid VARCHAR(50),
    project_name VARCHAR(255),
    date TIMESTAMP,
    
    -- Assignment
    assign_to INTEGER REFERENCES employees(id),
    assigned_by INTEGER REFERENCES employees(id),
    
    -- Call Tracking
    next_call_date DATE,
    last_call_date DATE,
    
    -- Personal Details
    father_or_husband_name VARCHAR(255),
    mailing_address TEXT,
    permanent_address TEXT,
    birth_date DATE,
    
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Customers (Converted Leads)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255),
    profession VARCHAR(100),
    father_or_husband_name VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    nid VARCHAR(50),
    email VARCHAR(255),
    mailing_address TEXT,
    permanent_address TEXT,
    birth_date DATE,
    crm_id VARCHAR(50),
    image_url TEXT,
    converted_from INTEGER REFERENCES crm_leads(id),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Import Templates:
```typescript
// Supported import modules
export const IMPORT_MODULES = [
    'crm_leads',
    'customers',
    'products',
    'projects',
    'project_locations',
    'vendors',
    'employees',
    'bank_cash_accounts',
    'income_expense_heads',
    'sales',
    'purchase_orders'
];

// Generate template CSV for each module
function getTemplateCsv(moduleName: string): string
    // Returns header row with expected columns
```

---

### 6. Financial Management Module

**Purpose:** Multi-project financial tracking and reporting

#### Features:
- **Multiple project ledgers** with project-level P&L
- **Initial balance setup** for bank/cash accounts
- **Cheque management** with status tracking
- **Financial reports** (trial balance, P&L, cash flow, balance sheet)
- **Account hierarchy** with parent-child relationships
- **Bank reconciliation** support

#### Financial Tables:
```sql
-- Bank/Cash Accounts (Finance)
CREATE TABLE bank_cash_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(255),
    account_type VARCHAR(50), -- 'Bank', 'Cash'
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    is_active BOOLEAN
);

-- Initial Bank/Cash Balances
CREATE TABLE initial_bank_cash_balances (
    id SERIAL PRIMARY KEY,
    bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
    project_id INTEGER REFERENCES projects(id),
    opening_balance DECIMAL(15,2),
    balance_date DATE
);

-- Cheques
CREATE TABLE cheques (
    id SERIAL PRIMARY KEY,
    cheque_number VARCHAR(50),
    bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
    amount DECIMAL(15,2),
    payee_name VARCHAR(255),
    issue_date DATE,
    cheque_date DATE,
    status VARCHAR(50), -- 'Issued', 'Deposited', 'Cleared', 'Bounced', 'Cancelled'
    voucher_id INTEGER REFERENCES vouchers(id)
);

-- Initial Income/Expense Head Balances
CREATE TABLE initial_income_expense_balances (
    id SERIAL PRIMARY KEY,
    head_id INTEGER REFERENCES income_expense_heads(id),
    project_id INTEGER REFERENCES projects(id),
    opening_balance DECIMAL(15,2),
    balance_date DATE
);
```

#### Financial Report Queries:
```sql
-- Trial Balance
SELECT 
    head_name,
    SUM(CASE WHEN is_debit THEN amount ELSE 0 END) as debit_balance,
    SUM(CASE WHEN NOT is_debit THEN amount ELSE 0 END) as credit_balance
FROM voucher_entries
GROUP BY head_name;

-- Ledger Report (Account-wise)
SELECT 
    date,
    particulars,
    debit_amount,
    credit_amount,
    balance
FROM (
    SELECT 
        v.date,
        v.particulars,
        v.amount as debit_amount,
        0 as credit_amount,
        SUM(v.amount) OVER (ORDER BY v.date) as balance
    FROM vouchers v
    WHERE v.type IN ('Credit', 'Journal')
    UNION ALL
    SELECT 
        v.date,
        v.particulars,
        0,
        v.amount,
        SUM(-v.amount) OVER (ORDER BY v.date)
    FROM vouchers v
    WHERE v.type IN ('Debit', 'Journal')
) ORDER BY date;

-- Profit & Loss Account
SELECT 
    'Income' as category,
    SUM(CASE WHEN h.head_type = 'Income' THEN v.amount ELSE 0 END) as amount
FROM vouchers v
JOIN income_expense_heads h ON h.id = v.head_id
WHERE v.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY h.head_type;

-- Cash Flow Statement
SELECT 
    h.full_path,
    v.date,
    v.amount,
    CASE WHEN h.head_type = 'Income' THEN 'Inflow' ELSE 'Outflow' END as direction
FROM vouchers v
JOIN income_expense_heads h ON h.id = v.head_id
WHERE v.type IN ('Credit', 'Debit')
ORDER BY v.date;
```

---

### 7. Project Management Module

**Purpose:** Multi-project structure and tracking

#### Features:
- **Project locations** with hierarchy
- **Project master** with project-level tracking
- **Real estate units/products** (apartments, shops, plots, parking)
- **Unit-specific attributes** (floor, facing, bedrooms, sqft, features)
- **Project-level financial tracking** with dedicated P&L

#### Project Tables:
```sql
-- Project Locations
CREATE TABLE project_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    is_active BOOLEAN
);

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255),
    project_location_id INTEGER REFERENCES project_locations(id),
    address TEXT,
    facing VARCHAR(100), -- North, South, East, West
    building_height VARCHAR(100),
    land_area VARCHAR(100),
    project_launching_date DATE,
    hand_over_date DATE,
    description TEXT,
    is_active BOOLEAN
);

-- Products (Real Estate Units)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    product_name VARCHAR(255),
    description TEXT,
    
    -- Real Estate Specific
    unit_type VARCHAR(50), -- 'Apartment', 'Shop', 'Plot', 'Parking'
    floor_no VARCHAR(20),
    unit_no VARCHAR(50),
    size_sqft DECIMAL(10,2),
    facing VARCHAR(50), -- 'North', 'South', 'East', 'West'
    bedrooms INTEGER,
    bathrooms INTEGER,
    
    -- Pricing
    base_price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    
    -- Status & Details
    status VARCHAR(30), -- 'available', 'booked', 'sold', 'handed_over'
    features TEXT, -- JSON array
    image_urls TEXT, -- JSON array
    is_active BOOLEAN
);
```

---

### 8. Employee & Vendor Management Module

**Purpose:** HR and vendor network management

#### Features:
- **Employee master** with assignments and roles
- **Vendor master** with ratings and history
- **Constructors** for project assignment
- **Assignment tracking** (lead assignment, task assignment)
- **Performance tracking** for employees and vendors

#### Tables:
```sql
-- Employees
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    role_id INTEGER REFERENCES roles(id),
    position VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN,
    joining_date DATE,
    created_at TIMESTAMP
);

-- Vendors
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(255),
    mailing_address TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    rating DECIMAL(3,1),
    is_active BOOLEAN
);

-- Constructors
CREATE TABLE constructors (
    id SERIAL PRIMARY KEY,
    constructor_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    specialization VARCHAR(255),
    is_active BOOLEAN
);

-- Lead Assignments
CREATE TABLE lead_assignments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES crm_leads(id),
    assigned_to INTEGER REFERENCES employees(id),
    assigned_by INTEGER REFERENCES employees(id),
    assigned_date TIMESTAMP
);

-- Constructor Assignments to Projects
CREATE TABLE assigned_constructors (
    id SERIAL PRIMARY KEY,
    constructor_id INTEGER REFERENCES constructors(id),
    project_id INTEGER REFERENCES projects(id),
    assignment_date DATE,
    completion_date DATE
);
```

---

## Database Schema

### Schema Overview

The complete database consists of **40+ tables** organized into logical groups:

#### Core Tables (Entities)
- `users` - System users with role assignment
- `roles` - Role definitions
- `permissions` - Permission types
- `modules` - System modules
- `role_permissions` - Role-permission mapping

#### CRM Tables
- `crm_leads` - Lead records
- `customers` - Customer master
- `lead_assignments` - Lead to employee assignment

#### Projects & Products
- `projects` - Project master
- `project_locations` - Project location hierarchy
- `products` - Real estate units
- `project_settings` - Project-level settings

#### Accounting Tables
- `vouchers` - Voucher entries (Credit, Debit, Journal, Contra)
- `income_expense_heads` - Chart of accounts with hierarchy
- `bank_cash_accounts` - Bank and cash accounts
- `initial_bank_cash_balances` - Opening balances
- `initial_income_expense_balances` - Opening balances for heads

#### Sales Tables
- `sales` - Sales/booking master
- `sale_payment_schedules` - Payment schedules
- `sale_payments` - Payment receipts
- `sale_documents` - Supporting documents
- `sale_activities` - Activity audit trail

#### Purchase Tables
- `purchase_requisitions` - Purchase requisitions
- `purchase_requisition_items` - Requisition items
- `purchase_orders` - Purchase orders
- `purchase_order_items` - PO line items
- `material_deliveries` - Delivery tracking
- `payment_schedules` - Payment schedules
- `advance_payables` - Advance payment tracking

#### Finance Tables
- `cheques` - Cheque management
- `notification_logs` - SMS/Email logs
- `sms_templates` - SMS templates
- `settings` - System settings

#### HR Tables
- `employees` - Employee master
- `constructors` - Constructor master
- `assigned_constructors` - Constructor project assignment

#### Vendor Tables
- `vendors` - Vendor master
- `vendor_ratings` - Vendor performance ratings

#### Finance Calculation Tables (Optional)
- `advance_payables` - Advance payment tracking and reconciliation

### Entity Relationship Diagram (Conceptual)

```
users ─────┬──────────→ roles
           │             │
           │             └──→ role_permissions ←──┐
           │                        ↑               │
           ├──→ modules ─────────────┘               │
           │                                        │
           ├──→ permissions ───────────────────────┘
           │
           ├──→ employees ─────→ assigned_constructors
           │
           ├──→ crm_leads ─┐
           │               ├──→ customers ────┐
           │               └─ lead_assignments│
           │                                  ↓
           ├──→ projects ──────→ products ────→ sales
           │       ↓                              ↓
           │   project_locations            sale_payment_schedules
           │       ↓                             ↓
           │   bank_cash_accounts        sale_payments → vouchers
           │       ↓                             ↓
           │   initial_bank_cash_        sale_documents
           │   balances                    ↓
           │       ↓                   sale_activities
           ├──→ vouchers
           │       ↓
           │   income_expense_heads
           │       ↓
           │   initial_income_expense_balances
           │
           ├──→ purchase_orders ──→ purchase_order_items
           │       ↓                   ↓
           │   purchase_requisitions  material_deliveries
           │       ↓
           │   purchase_requisition_items
           │       ↓
           │   payment_schedules
           │       ↓
           │   advance_payables
           │
           ├──→ vendors
           │
           ├──→ cheques
           │
           └──→ settings
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
**Purpose:** User login with credentials
```
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Accountant"
  }
}

Response (Error):
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### POST `/api/auth/logout`
**Purpose:** Clear session and logout user
```
Response:
{
  "success": true
}
```

#### GET `/api/auth/me`
**Purpose:** Get current authenticated user
```
Response:
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

### Accounting Routes (`/api/vouchers`)

#### GET `/api/vouchers`
**Purpose:** List all vouchers with filters
```
Query Parameters:
- type?: 'Credit' | 'Debit' | 'Journal' | 'Contra'
- projectId?: number
- fromDate?: string (YYYY-MM-DD)
- toDate?: string (YYYY-MM-DD)
- page?: number
- limit?: number

Response:
{
  "data": [
    {
      "id": 1,
      "voucherNo": "CR-2025-0001",
      "type": "Credit",
      "date": "2025-01-15",
      "amount": 50000,
      "particulars": "Customer payment",
      "projectId": 1,
      "isConfirmed": true,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/vouchers`
**Purpose:** Create new voucher
```
Request:
{
  "type": "Credit",
  "projectId": 1,
  "date": "2025-01-15",
  "amount": 50000,
  "particulars": "Customer payment",
  "expenseHeadId": 5,
  "bankCashId": 2,
  "isConfirmed": true
}

Response (Success):
{
  "success": true,
  "voucherId": 1,
  "voucherNo": "CR-2025-0001"
}
```

#### GET `/api/vouchers/[id]`
**Purpose:** Get specific voucher details
```
Response:
{
  "id": 1,
  "voucherNo": "CR-2025-0001",
  "type": "Credit",
  ...complete voucher data
}
```

#### PUT `/api/vouchers/[id]`
**Purpose:** Update voucher
```
Request: Same as POST /api/vouchers

Response:
{
  "success": true,
  "message": "Voucher updated"
}
```

#### DELETE `/api/vouchers/[id]`
**Purpose:** Soft delete voucher (mark as deleted)
```
Response:
{
  "success": true,
  "message": "Voucher deleted"
}
```

---

### Sales Routes (`/api/sales-v2`)

#### GET `/api/sales-v2`
**Purpose:** List all bookings/sales
```
Query Parameters:
- projectId?: number
- customerId?: number
- status?: 'booked' | 'in_progress' | 'handed_over'
- fromDate?: string
- toDate?: string
- page?: number
- limit?: number

Response:
{
  "data": [
    {
      "id": 1,
      "saleNo": "SALE-2025-001",
      "saleStatus": "booked",
      "customerId": 5,
      "customerName": "Ahmed Hassan",
      "productId": 12,
      "unitName": "Apt-201",
      "projectId": 1,
      "projectName": "Gulshan Heights",
      "netPrice": 2500000,
      "totalPaid": 500000,
      "outstandingAmount": 2000000,
      "bookingDate": "2025-01-10",
      "paymentPlan": "installment",
      "installmentCount": 4,
      "nextPaymentDue": "2025-02-10",
      "createdAt": "2025-01-10T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/sales-v2`
**Purpose:** Create new booking
```
Request:
{
  "customerId": 5,
  "productId": 12,
  "projectId": 1,
  "basePrice": 2500000,
  "discountPercent": 5,
  "discountAmount": 125000,
  "netPrice": 2375000,
  "bookingAmount": 100000,
  "paymentPlan": "installment",
  "installmentCount": 4,
  "bookingDate": "2025-01-10",
  "nomineeNid": "1234567890",
  "paymentSchedule": [
    {
      "scheduleType": "booking",
      "dueDate": "2025-01-10",
      "amount": 100000
    },
    {
      "scheduleType": "installment",
      "dueDate": "2025-02-10",
      "amount": 568750
    }
  ]
}

Response:
{
  "success": true,
  "saleId": 1,
  "saleNo": "SALE-2025-001"
}
```

#### POST `/api/sales-v2/[id]/documents`
**Purpose:** Upload sale document
```
Request (multipart/form-data):
- documentType: 'agreement' | 'nid_copy' | 'photo' | 'receipt'
- file: File
- documentName: string

Response:
{
  "success": true,
  "documentId": 15,
  "documentUrl": "/uploads/sale-docs/doc-123.pdf"
}
```

#### POST `/api/sales-v2/[id]/handover`
**Purpose:** Mark sale as handed over
```
Request:
{
  "actualHandoverDate": "2025-06-15",
  "notes": "All documents handed over successfully"
}

Response:
{
  "success": true,
  "message": "Sale marked as handed over",
  "saleStatus": "handed_over"
}
```

---

### Customer Routes (`/api/customers`)

#### GET `/api/customers`
**Purpose:** List all customers
```
Query Parameters:
- search?: string (search by name, email, phone)
- projectId?: number
- page?: number
- limit?: number

Response:
{
  "data": [
    {
      "id": 5,
      "customerId": "CUST-2024-001",
      "customerName": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "phone": "01712345678",
      "nid": "1234567890",
      "fatherOrHusbandName": "Hassan Ahmad",
      "mailingAddress": "Dhaka, Bangladesh",
      "birthDate": "1985-06-15",
      "convertedFrom": 3,
      "isActive": true,
      "createdAt": "2024-12-01T09:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/customers`
**Purpose:** Create new customer
```
Request:
{
  "customerName": "Ahmed Hassan",
  "profession": "Engineer",
  "email": "ahmed@example.com",
  "phone": "01712345678",
  "whatsapp": "01712345678",
  "nid": "1234567890",
  "fatherOrHusbandName": "Hassan Ahmad",
  "mailingAddress": "Dhaka, Bangladesh",
  "permanentAddress": "Dhaka, Bangladesh",
  "birthDate": "1985-06-15",
  "imageUrl": null
}

Response:
{
  "success": true,
  "customerId": 5,
  "customerNo": "CUST-2024-001"
}
```

---

### Purchase Routes (`/api/purchase`)

#### GET `/api/purchase/purchase-orders`
**Purpose:** List all purchase orders
```
Query Parameters:
- vendorId?: number
- projectId?: number
- status?: string
- page?: number
- limit?: number

Response:
{
  "data": [
    {
      "id": 1,
      "poNumber": "PO-2025-001",
      "vendorId": 3,
      "vendorName": "ABC Cement Ltd",
      "projectId": 1,
      "orderDate": "2025-01-05",
      "expectedDeliveryDate": "2025-01-20",
      "subtotal": 1000000,
      "discountPercentage": 5,
      "discountAmount": 50000,
      "taxPercentage": 15,
      "taxAmount": 142500,
      "totalAmount": 1092500,
      "status": "In Progress",
      "items": [
        {
          "materialType": "Cement",
          "materialSpecification": "Grade A",
          "qty": 100,
          "uom": "BAG",
          "rate": 300,
          "amount": 30000,
          "deliveredQty": 80,
          "acceptedQty": 80,
          "remainingQty": 20
        }
      ],
      "createdAt": "2025-01-05T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/purchase/purchase-orders`
**Purpose:** Create purchase order
```
Request:
{
  "vendorId": 3,
  "projectId": 1,
  "requisitionId": 2,
  "orderDate": "2025-01-05",
  "expectedDeliveryDate": "2025-01-20",
  "paymentTerms": "30% Advance, 50% on Delivery, 20% after 15 days",
  "items": [
    {
      "materialType": "Cement",
      "materialSpecification": "Grade A",
      "qty": 100,
      "uom": "BAG",
      "rate": 300,
      "amount": 30000
    }
  ],
  "discountPercentage": 5,
  "taxPercentage": 15,
  "approvedBy": 2
}

Response:
{
  "success": true,
  "poId": 1,
  "poNumber": "PO-2025-001",
  "totalAmount": 1092500
}
```

#### POST `/api/purchase/material-deliveries`
**Purpose:** Record material delivery
```
Request:
{
  "poId": 1,
  "vendorId": 3,
  "deliveryDate": "2025-01-20",
  "deliverySlipNumber": "DS-12345",
  "vehicleNumber": "DH-2020",
  "driverName": "Karim",
  "receivedBy": 5,
  "deliveredQty": 80,
  "acceptedQty": 80,
  "rejectedQty": 0,
  "qualityStatus": "Passed",
  "storageLocation": "Warehouse A"
}

Response:
{
  "success": true,
  "deliveryId": 1,
  "deliveryNumber": "MAT-2025-001"
}
```

---

### CRM Routes (`/api/crm`)

#### GET `/api/crm/leads`
**Purpose:** List all leads
```
Query Parameters:
- status?: 'New' | 'Interested' | 'Negotiating' | 'Hot' | 'Cold'
- source?: string
- assignedTo?: number
- page?: number
- limit?: number

Response:
{
  "data": [
    {
      "id": 1,
      "crmId": "CRM-2024-001",
      "customerName": "Fatima Khan",
      "phone": "01812345678",
      "whatsapp": "01812345678",
      "email": "fatima@example.com",
      "nid": "1234567890",
      "leadsStatus": "Hot",
      "leadSource": "Referral",
      "assignTo": 2,
      "nextCallDate": "2025-01-20",
      "lastCallDate": "2025-01-15",
      "isActive": true,
      "createdAt": "2024-12-10T14:00:00Z"
    }
  ],
  "total": 87,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/crm/leads/convert`
**Purpose:** Convert lead to customer
```
Request:
{
  "leadId": 1
}

Response:
{
  "success": true,
  "customerId": 5,
  "customerNo": "CUST-2024-001"
}
```

#### POST `/api/crm/leads/import`
**Purpose:** Bulk import leads from CSV
```
Request (multipart/form-data):
- file: CSV file with columns:
  - customer_name
  - phone
  - email
  - nid
  - lead_source
  - project_name
  - assign_to (employee ID)

Response:
{
  "success": true,
  "imported": 150,
  "failed": 3,
  "errors": [
    "Row 5: Missing customer_name",
    "Row 8: Invalid phone format"
  ]
}
```

---

### User & Permission Routes (`/api/users`, `/api/roles`)

#### GET `/api/users`
**Purpose:** List all users
```
Response:
{
  "data": [
    {
      "id": "123",
      "email": "user@example.com",
      "name": "John Doe",
      "roleId": 2,
      "roleName": "Accountant",
      "isActive": true,
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

#### POST `/api/users`
**Purpose:** Create new user
```
Request:
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "roleId": 2
}

Response:
{
  "success": true,
  "userId": "124",
  "email": "newuser@example.com"
}
```

#### GET `/api/roles`
**Purpose:** List all roles
```
Response:
{
  "data": [
    {
      "id": 1,
      "roleName": "Admin",
      "description": "Full system access",
      "isActive": true
    },
    {
      "id": 2,
      "roleName": "Accountant",
      "description": "Accounting and finance access",
      "isActive": true
    }
  ]
}
```

#### GET `/api/user-permissions/[userId]`
**Purpose:** Get all permissions for a user
```
Response:
{
  "user": {
    "id": "123",
    "name": "John Doe",
    "role": "Accountant"
  },
  "permissions": {
    "vouchers": {
      "module_show": true,
      "show": true,
      "create": true,
      "edit": true,
      "delete": true,
      "pdf": true,
      "trash_show": false,
      "restore": false,
      "permanently_delete": false
    },
    "customers": {
      "module_show": true,
      "show": true,
      "create": false,
      ...
    }
  }
}
```

---

### Reports Routes (`/api/reports`)

#### GET `/api/reports/trial-balance`
**Purpose:** Generate trial balance report
```
Query Parameters:
- projectId: number
- asOfDate?: string (default: today)

Response:
{
  "projectName": "Gulshan Heights",
  "asOfDate": "2025-01-31",
  "report": [
    {
      "accountCode": "1001",
      "accountName": "Cash",
      "debitBalance": 500000,
      "creditBalance": 0,
      "balance": 500000
    },
    {
      "accountCode": "2001",
      "accountName": "Accounts Payable",
      "debitBalance": 0,
      "creditBalance": 750000,
      "balance": -750000
    }
  ],
  "totals": {
    "totalDebit": 2000000,
    "totalCredit": 2000000
  }
}
```

#### GET `/api/reports/ledger`
**Purpose:** Generate ledger report for specific account
```
Query Parameters:
- projectId: number
- accountId: number
- fromDate?: string
- toDate?: string

Response:
{
  "account": {
    "id": 5,
    "accountCode": "1001",
    "accountName": "Cash"
  },
  "project": "Gulshan Heights",
  "period": "01 Jan 2025 - 31 Jan 2025",
  "entries": [
    {
      "date": "2025-01-05",
      "voucherNo": "CR-2025-001",
      "particulars": "Customer payment",
      "debitAmount": 50000,
      "creditAmount": 0,
      "balance": 50000,
      "type": "Debit"
    }
  ],
  "summary": {
    "openingBalance": 500000,
    "totalDebit": 150000,
    "totalCredit": 0,
    "closingBalance": 650000
  }
}
```

#### GET `/api/reports/profit-loss`
**Purpose:** Generate P&L statement
```
Query Parameters:
- projectId: number
- year: number
- month?: number (for monthly P&L)

Response:
{
  "projectName": "Gulshan Heights",
  "period": "Jan 2025",
  "statement": {
    "revenue": {
      "grossIncome": 5000000,
      "otherIncome": 50000,
      "totalIncome": 5050000
    },
    "expenses": {
      "materialCost": 2000000,
      "laborCost": 1000000,
      "overheadCost": 500000,
      "totalExpenses": 3500000
    },
    "profitLoss": 1550000,
    "profitMargin": "30.7%"
  }
}
```

#### GET `/api/reports/cash-bank-book`
**Purpose:** Bank/Cash book report
```
Query Parameters:
- projectId: number
- accountId: number
- fromDate?: string
- toDate?: string

Response:
{
  "account": {
    "id": 2,
    "accountName": "HBL Current Account",
    "accountNumber": "1234567890"
  },
  "transactions": [
    {
      "date": "2025-01-05",
      "voucherNo": "CV-2025-001",
      "particulars": "Transfer from cash",
      "deposit": 100000,
      "withdrawal": 0,
      "balance": 600000
    }
  ],
  "summary": {
    "openingBalance": 500000,
    "totalDeposit": 150000,
    "totalWithdrawal": 0,
    "closingBalance": 650000
  }
}
```

---

## Business Logic & Calculations

### 1. Voucher Numbering System

**Logic:**
```
Formula: PREFIX-YEAR-SERIAL
- PREFIX: Based on voucher type
- YEAR: Current fiscal year (4 digits)
- SERIAL: 4-digit counter, zero-padded, incremented per voucher type per year
```

**Example:**
- Credit Voucher: `CR-2025-0001`
- Debit Voucher: `DV-2025-0052`
- Journal Voucher: `JV-2025-0010`
- Contra Voucher: `CV-2025-0003`

**Implementation:**
```typescript
function buildVoucherNo(
    voucherType: string,
    serial: number,
    year: number = new Date().getFullYear()
): string {
    const prefix = getVoucherPrefix(voucherType); // 'CR', 'DV', 'JV', 'CV'
    return `${prefix}-${year}-${String(serial).padStart(4, "0")}`;
}

// Get next serial for type/year
async function getNextVoucherSerial(
    type: string,
    year: number
): Promise<number> {
    const result = await sql`
        SELECT MAX(CAST(SUBSTRING(voucher_no, 10, 4) AS INT)) as max_serial
        FROM vouchers
        WHERE voucher_type = ${type}
        AND EXTRACT(YEAR FROM date) = ${year}
    `;
    
    return (result[0]?.max_serial ?? 0) + 1;
}
```

### 2. Account Code Generation

**System:**
- 4-digit hierarchical codes
- Unique within ledger heads
- Format: `0001` to `9999`
- Auto-incremented starting from `1000`

**Hierarchy Example:**
```
1000 - Assets
  1001 - Cash
  1002 - Bank
    1002A - HBL Account
    1002B - SCB Account
  1003 - Receivables
2000 - Liabilities
  2001 - Payables
  2002 - Loans
3000 - Equity
4000 - Income
5000 - Expenses
```

**Logic:**
```typescript
async function getNextAccountCode(): Promise<string> {
    const result = await sql`
        SELECT COALESCE(MAX(account_code::int), 999) AS max_code
        FROM income_expense_heads
        WHERE account_code ~ '^[0-9]{4}$'
    `;
    
    const maxCode = result[0]?.max_code ?? 999;
    const nextCode = maxCode + 1;
    
    if (nextCode > 9999) {
        throw new Error("No available 4-digit account codes");
    }
    
    return String(nextCode).padStart(4, "0");
}
```

### 3. Purchase Order Calculation Engine

**Line Item Calculation:**
```typescript
function calculateLineAmount(qty: number, rate: number): number {
    return Math.max(0, (qty || 0) * (rate || 0));
}
```

**PO Total Calculation:**
```
1. Subtotal = ∑(Item Qty × Item Rate) for all items
2. Discount Amount = Subtotal × Discount% / 100
3. Taxable Amount = Subtotal - Discount Amount
4. Tax Amount = Taxable Amount × Tax% / 100
5. Total Amount = Taxable Amount + Tax Amount

Example:
Items:
  - Item 1: 100 × 300 = 30,000
  - Item 2: 50 × 400 = 20,000
  Subtotal: 50,000

Discount: 5% of 50,000 = 2,500
Taxable: 50,000 - 2,500 = 47,500

Tax: 15% of 47,500 = 7,125
Total: 47,500 + 7,125 = 54,625
```

**Implementation:**
```typescript
interface POCalculation {
    qty: number;
    rate: number;
    lineAmount: number;
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
}

function calculatePOTotals(
    items: POLineItem[],
    discountPercentage: number = 0,
    taxPercentage: number = 0
): POCalculation {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
        return sum + calculateLineAmount(item.qty, item.rate);
    }, 0);
    
    // Calculate discount
    const discountAmount = (subtotal * (discountPercentage || 0)) / 100;
    
    // Calculate tax on taxable amount
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (taxPercentage || 0)) / 100;
    
    // Calculate total
    const totalAmount = taxableAmount + taxAmount;
    
    return {
        qty: items.reduce((sum, item) => sum + (item.qty || 0), 0),
        rate: items.length > 0 ? subtotal / items.length : 0,
        lineAmount: subtotal,
        subtotal,
        discountPercentage: discountPercentage || 0,
        discountAmount,
        taxPercentage: taxPercentage || 0,
        taxAmount,
        totalAmount,
    };
}
```

### 4. Payment Amount to Words (Bengali)

**Logic:** Convert numerical amount to written form in Bengali/English

**Example:**
```
1000 → "one thousand taka only"
2500 → "two thousand five hundred taka only"
1250.50 → "one thousand two hundred fifty taka and fifty paisa only"
1000000 → "ten lakh taka only" (using scale)
```

**Implementation:**
```typescript
const UNITS = ["", "one", "two", "three", ..., "nine"];
const TEENS = ["ten", "eleven", ..., "nineteen"];
const TENS = ["", "", "twenty", "thirty", ..., "ninety"];
const SCALES = [
    { value: 1_000_000_000, label: "billion" },
    { value: 1_000_000, label: "million" },
    { value: 1_000, label: "thousand" },
];

function amountToWordsBDT(amount: number): string {
    if (!Number.isFinite(amount)) return "zero taka only";
    
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    let taka = Math.floor(absAmount);
    let paisa = Math.round((absAmount - taka) * 100);
    
    // Adjust if paisa rounds to 100
    if (paisa === 100) {
        taka += 1;
        paisa = 0;
    }
    
    const takaWords = integerToWords(taka);
    const prefix = isNegative ? "minus " : "";
    
    if (paisa > 0) {
        const paisaWords = integerToWords(paisa);
        return `${prefix}${takaWords} taka and ${paisaWords} paisa only`;
    }
    
    return `${prefix}${takaWords} taka only`;
}
```

### 5. Sales Payment Calculation

**Booking Workflow:**
```
1. Base Price: 2,500,000
2. Discount (5%): -125,000
3. Net Price: 2,375,000
4. Payment Plan: Installment (4 payments)

Schedule (example):
- Booking: 100,000 (immediately)
- Installment 1: 568,750 (due 30 days)
- Installment 2: 568,750 (due 60 days)
- Installment 3: 568,750 (due 90 days)
- Installment 4: 568,750 (due 120 days)
```

**Logic:**
```typescript
function calculatePaymentSchedule(
    netPrice: number,
    paymentPlan: string,
    installmentCount: number = 1,
    customSchedule?: PaymentScheduleItem[]
): PaymentScheduleItem[] {
    if (customSchedule) {
        // Use custom schedule provided
        return customSchedule.map(item => ({
            ...item,
            amount: Math.round((netPrice * item.percentage) / 100)
        }));
    }
    
    if (paymentPlan === "full") {
        return [{
            scheduleType: "full_payment",
            amount: netPrice,
            dueDate: new Date()
        }];
    }
    
    if (paymentPlan === "installment") {
        const perInstallment = Math.round(netPrice / installmentCount);
        const schedules = [];
        
        for (let i = 0; i < installmentCount; i++) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (i * 30)); // 30-day intervals
            
            schedules.push({
                scheduleType: "installment",
                installmentNo: i + 1,
                amount: i === installmentCount - 1 
                    ? netPrice - (perInstallment * i)  // Last payment catches rounding
                    : perInstallment,
                dueDate
            });
        }
        
        return schedules;
    }
    
    return [];
}
```

### 6. Advance Payables Reconciliation

**Logic:**
```
When Purchase Order is Completed:
1. Advance Paid to Vendor: 300,000
2. PO Total Amount: 280,000

Reconciliation:
- Reconciled Amount = MIN(Advance Paid, PO Total)
  = MIN(300,000, 280,000) = 280,000
- Excess Amount = Advance Paid - PO Total
  = 300,000 - 280,000 = 20,000 (Refund to vendor)
- Remaining to Pay = 0 (Already covered by advance)

If Advance < PO Total:
- Remaining to Pay = PO Total - Advance Paid
```

**Implementation:**
```typescript
interface AdvancePayableReconciliation {
    vendorId: number;
    poId: number;
    advancePaid: number;
    poTotal: number;
    reconciledAmount: number;
    excessAmount?: number;
    remainingToPay?: number;
    status: 'reconciled' | 'excess' | 'partial';
}

function reconcileAdvancePayable(
    advancePaid: number,
    poTotal: number
): AdvancePayableReconciliation {
    const reconciledAmount = Math.min(advancePaid, poTotal);
    const difference = advancePaid - poTotal;
    
    let status: 'reconciled' | 'excess' | 'partial';
    let excessAmount = 0;
    let remainingToPay = 0;
    
    if (difference > 0) {
        status = 'excess';
        excessAmount = difference;
    } else if (difference < 0) {
        status = 'partial';
        remainingToPay = Math.abs(difference);
    } else {
        status = 'reconciled';
    }
    
    return {
        reconciledAmount,
        excessAmount,
        remainingToPay,
        status
    };
}
```

### 7. Payment Method Normalization

**Supported Methods:**
- `Cash`
- `Bank Transfer` / `Online Transfer`
- `Cheque`
- `Online` / `Online Banking`
- `Mobile Banking`

**Logic:**
```typescript
type PaymentMethod = 
    | "Cash"
    | "Bank Transfer"
    | "Cheque"
    | "Online"
    | "Online Transfer"
    | "Mobile Banking";

function normalizePaymentMethod(value?: string): PaymentMethod {
    if (!value) return "Cash";
    
    const normalized = value.trim().toLowerCase();
    
    if (normalized === "cash") return "Cash";
    if (normalized === "bank transfer") return "Bank Transfer";
    if (normalized === "cheque") return "Cheque";
    if (normalized === "online") return "Online";
    if (normalized === "online transfer") return "Online Transfer";
    if (normalized === "mobile banking") return "Mobile Banking";
    
    return "Cash"; // Default fallback
}
```

---

## Authentication & Authorization

### Session Management

**Current Implementation:**
- Session stored in HTTP-only cookie: `session`
- Session value: JSON with `{ userId: string }`
- Validated on every request via middleware

**Authentication Flow:**
```
1. User submits login form (email, password)
2. Backend validates against users table (bcrypt)
3. On success, sets session cookie with userId
4. Middleware validates session on protected routes
5. Routes fetch user permissions dynamically

// middleware.ts
export function middleware(request: NextRequest) {
    const session = request.cookies.get("session");
    const isAuthPage = request.nextUrl.pathname.startsWith("/login");
    const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
    
    // Allow auth API routes
    if (isApiAuthRoute) return NextResponse.next();
    
    // Redirect to login if not authenticated
    if (!session && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Redirect to dashboard if authenticated and on login
    if (session && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    return NextResponse.next();
}
```

### Permission System

**RBAC (Role-Based Access Control) Tables:**

| Role | Admin | Manager | Accountant | Sales | Purchase | HR | Viewer |
|------|-------|---------|-----------|-------|----------|----|-|
| User | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Vouchers | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ (read) |
| Sales | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ (read) |
| Purchase | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ (read) |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (read) |
| Settings | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Permission Hierarchy:**
```sql
Users
└── Role (1:1)
    └── Role Permissions (1:Many)
        ├── Module (relation)
        └── Permission (relation)

-- Permission Types for Each Module:
- module_show       (access module)
- show              (view records)
- create            (create records)
- edit              (edit records)
- delete            (soft delete)
- pdf               (generate PDF)
- trash_show        (view trash)
- restore           (restore from trash)
- permanently_delete (hard delete)
```

**Permission Checking:**
```typescript
// Get user permissions
async function getUserPermissions(userId: string): Promise<UserPermissions> {
    // Returns: { moduleName: { permissionName: boolean } }
    // Example: { 
    //   vouchers: { module_show: true, create: true, delete: false },
    //   customers: { module_show: true, show: true, create: false }
    // }
}

// Check specific permission
async function hasPermission(
    userId: string,
    moduleName: string,
    permissionName: string
): Promise<boolean>

// Check module access
async function canAccessModule(
    userId: string,
    moduleName: string
): Promise<boolean> {
    // Checks for 'module_show' permission
}

// Usage in routes:
app.get('/api/vouchers', async (req) => {
    const userId = getCurrentUserId(req);
    
    if (!await hasPermission(userId, 'vouchers', 'show')) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    // Proceed with fetching vouchers
});

// Usage in components:
<PermissionGate module="vouchers" permission="create">
    <CreateVoucherButton />
</PermissionGate>
```

---

## UI Components

### Component Library Structure

**Location:** `components/`

#### Primitive UI Components (`components/ui/`)
- Built from Radix UI + Tailwind CSS
- Custom styling with class-variance-authority (CVA)
- Components: Button, Card, Dialog, Form, Input, Select, Table, Tabs, etc.

#### Domain-Specific Components (`components/`)

**1. Transaction Forms**
```typescript
// components/transaction-form.tsx
Props:
- initialData?: VoucherFormData
- onSubmit: (data: VoucherFormData) => Promise<void>
- isLoading?: boolean
- voucher Type: 'Credit' | 'Debit' | 'Journal' | 'Contra'

Features:
- Real-time validation with Zod schemas
- Dynamic field rendering based on type
- Amount-to-words display
- PDF preview before submit
```

**2. Purchase Order Form**
```typescript
// components/po-form.tsx
Props:
- orderId?: number
- vendors: Vendor[]
- projects: Project[]
- onSubmit: (data) => Promise<void>

Features:
- Line-item management with add/remove
- Real-time total calculations
- Discount/tax percentage inputs
- Payment terms configuration
```

**3. Journal Voucher Entry**
```typescript
// components/journal-voucher.tsx
Features:
- Dual-side entry (Dr/Cr)
- Automatic amount validation
- Account selection with search
- Print preview
```

**4. Sales Booking Stepper**
```typescript
// components/booking-stepper.tsx
Props:
- steps: 'customer' | 'unit' | 'payment' | 'confirm'
- onStepComplete: (step, data) => Promise<void>

Features:
- Multi-step form wizard
- Step validation
- Progress indication
- Save/Continue functionality
```

**5. Dynamic Payment Plan Builder**
```typescript
// components/dynamic-payment-plan.tsx
Props:
- totalAmount: number
- paymentPlan: 'full' | 'installment' | 'milestone'
- onChange: (schedule) => void

Features:
- Add/remove milestones
- Auto-calculate installment amounts
- Percentage-based allocation
- Due date picker for each milestone
```

**6. PDF Templates**
```typescript
// components/pdf-template.tsx
- Voucher PDF export
- Sales receipt PDF
- Purchase order PDF
- Statement of account
- Trial balance report
```

**7. Permission Gate (Conditional Rendering)**
```typescript
// components/permission-gate.tsx
Props:
- module: string
- permission: string
- fallback?: ReactNode

Usage:
<PermissionGate module="vouchers" permission="delete">
    <DeleteButton />
</PermissionGate>

// Only renders if user has vouchers:delete permission
```

#### Sidebar Navigation
```typescript
// components/app-sidebar.tsx
Features:
- Dynamic module list based on user permissions
- Breadcrumb navigation
- Active route highlighting
- Collapsed/expanded state
```

---

## Utilities & Helper Functions

### Database Utilities (`lib/db.ts`)

```typescript
// Connection setup with Neon serverless
export const sql = neon(process.env.DATABASE_URL);

// Query execution with timing and error handling
export async function executeQuery<T>(
    query: string,
    params?: any[]
): Promise<T[]>;
```

### Authentication Utilities (`lib/auth.ts`)

```typescript
// Get current authenticated user
async function getCurrentUser(): Promise<User | null>;

// Get user with permissions
async function getUserWithPermissions(userId: string): Promise<UserWithPermissions | null>;

// Check permission
async function checkPermission(
    userId: string,
    permission: string
): Promise<boolean>;
```

### Permission Utilities (`lib/permissions.ts`)

```typescript
// Get all user permissions
async function getUserPermissions(userId: string): Promise<UserPermissions>;

// Check specific permission
async function hasPermission(
    userId: string,
    moduleName: string,
    permissionName: string
): Promise<boolean>;

// Check module access
async function canAccessModule(
    userId: string,
    moduleName: string
): Promise<boolean>;
```

### Account Code Management (`lib/account-code.ts`)

```typescript
// Initialize account code schema
async function ensureAccountCodeSchema(): Promise<void>;

// Get next available 4-digit code
async function getNextAccountCode(): Promise<string>;

// Validate account code format
function isValidAccountCode(code: string): boolean;
```

### Payment Utilities (`lib/payment-utils.ts`)

```typescript
// Convert amount to words in Bengali
function amountToWordsBDT(amount: number): string;

// Normalize payment method
function normalizePaymentMethod(value?: string): PaymentMethod;

// Format currency for display
function formatCurrency(amount: number): string;
```

### PO Calculation Engine (`lib/po-calculations.ts`)

```typescript
// Calculate line item amount
function calculateLineAmount(qty: number, rate: number): number;

// Calculate all PO totals
function calculatePOTotals(
    items: POLineItem[],
    discountPercentage?: number,
    taxPercentage?: number
): POCalculation;

// Format currency
function formatCurrency(amount: number): string;

// Validate line item
function validateLineItem(item: POLineItem): {
    valid: boolean;
    errors: string[];
};

// Validate complete PO
function validatePO(calculation: POCalculation): {
    valid: boolean;
    errors: string[];
};
```

### Voucher Utilities (`lib/voucher-utils.ts`)

```typescript
// Normalize voucher type
function normalizeVoucherType(voucherType: string): VoucherType | null;

// Get voucher prefix
function getVoucherPrefix(voucherType: string): string;

// Build voucher number
function buildVoucherNo(
    voucherType: string,
    serial: number,
    year?: number
): string;
```

### PDF Utilities (`lib/pdf-utils.ts`)

```typescript
// Get company settings for PDF
async function getCompanySettings(): Promise<CompanySettings>;

// Print document (browser print dialog)
function printDocument(elementId: string, documentTitle?: string): void;

// Generate PDF template
function generatePDFTemplate(data: any): string;

// Format currency for PDF
function formatCurrency(amount: number, symbol?: string): string;
```

### Import Templates (`lib/import-templates.ts`)

```typescript
// List of importable modules
export const IMPORT_MODULES: ImportModule[];

// Generate CSV template
function getTemplateCsv(moduleName: ImportModule): string;

// Check if value is valid import module
function isImportModule(value: string): value is ImportModule;
```

### Reference Party Lookup (`lib/reference-party.ts`)

```typescript
// Search vendors, customers, employees
async function searchReferenceParty(
    query: string,
    type: 'vendor' | 'customer' | 'employee'
): Promise<ReferenceParty[]>;
```

### Vendor Code Generation (`lib/vendor-code.ts`)

```typescript
// Generate unique vendor code
async function generateVendorCode(): Promise<string>;

// Format: VEND-YYYY-0001
```

### SMS Service Integration (`lib/sms-service.ts`)

```typescript
// Send SMS notification
async function sendSMS(
    phoneNumber: string,
    message: string,
    templateName?: string
): Promise<{ success: boolean; messageId?: string }>;

// Parse template with variables
function parseTemplate(template: string, variables: Record<string, any>): string;
```

### Validation Schemas (`lib/validations/`)

#### Accounting Validations (`accounting.ts`)
```typescript
const creditVoucherSchema: ZodSchema;
const debitVoucherSchema: ZodSchema;
const journalVoucherSchema: ZodSchema;
const contraVoucherSchema: ZodSchema;
const voucherFilterSchema: ZodSchema;
```

#### CRM Validations (`crm.ts`)
```typescript
const leadSchema: ZodSchema;
const customerSchema: ZodSchema;
const leadFilterSchema: ZodSchema;
```

#### Finance Validations (`finance.ts`)
```typescript
const bankCashSchema: ZodSchema;
const chequeSchema: ZodSchema;
const paymentScheduleSchema: ZodSchema;
```

### React Query Hooks (`lib/hooks/`)

#### Accounting Hooks (`use-accounting.ts`)
```typescript
export function useVouchers(filters?: VoucherFilters);
export function useCreditVouchers(projectId?: number);
export function useDebitVouchers(projectId?: number);
export function useJournalVouchers(projectId?: number);
export function useContraVouchers(projectId?: number);
export function useVoucher(id: number);
export function useCreateVoucher();
export function useUpdateVoucher();
export function useDeleteVoucher();
export function useLedgerReport(params);
export function useCashBankBook(params);
export function useTrialBalance(params);
export function useProfitLoss(params);
export function useBalanceSheet(params);
```

#### CRM Hooks (`use-crm.ts`)
```typescript
export function useLeads(filters?: LeadFilterInput);
export function useLead(id: number);
export function useCreateLead();
export function useUpdateLead(id: number);
export function useDeleteLead();
export function useConvertLead();
export function useImportLeads();
export function useEmployees();
export function useSettings();
```

### State Management (`lib/stores/`)

#### UI Store (Zustand)
```typescript
// components/ui-store.ts
Store state:
- sidebarOpen: boolean
- theme: 'light' | 'dark'
- selectedProject: number | null
- activeModule: string | null

Methods:
- toggleSidebar()
- setTheme(theme)
- setSelectedProject(id)
- setActiveModule(name)
```

---

## Configuration & Deployment

### Environment Variables (`.env.local`)

```
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Authentication
SESSION_SECRET=your-secret-key

# SMS Service
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=YourCompany

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760  # 10MB

# Features
SMS_ENABLED=true
EMAIL_ENABLED=false
AUTO_CREATE_VOUCHER=true

# Deployment
VERCEL_URL=https://abashon-erp-real-estate.vercel.app
NODE_ENV=production
```

### Next.js Configuration (`next.config.mjs`)

```javascript
export default {
    reactStrictMode: true,
    swcMinify: true,
    
    // Image optimization
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' }
        ]
    },
    
    // Build output
    output: 'standalone',
    
    // Environment
    env: {
        BUILD_TIME: new Date().toISOString()
    }
};
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "jsx": "preserve",
        "module": "ESNext",
        "moduleResolution": "node",
        "baseUrl": ".",
        "paths": {
            "@/*": ["./*"]
        },
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    }
}
```

### Build & Deployment

**Local Development:**
```bash
# Install dependencies
pnpm install

# Run database migrations
# psql -f scripts/001_create_database_schema.sql
# psql -f scripts/002_add_accounting_fields.sql
# ... run all migrations in order

# Start dev server
pnpm run dev

# Application runs at http://localhost:3000
```

**Production Build:**
```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Run tests
pnpm run test

# Build
pnpm run build

# Start production server
pnpm run start
```

**Deployment to Vercel:**
```bash
# Vercel automatically detects Next.js
# Configure environment variables in Vercel dashboard
# Push to GitHub and Vercel auto-deploys

# Or manual deployment:
pnpm run build
vercel deploy --prod
```

### Database Migrations

**Migration Files (Sequential Execution):**
```
1. 001_create_database_schema.sql         # Core tables
2. 002_add_accounting_fields.sql          # Accounting additions
3. 002_add_users_table.sql                # User system
4. 003_add_performance_indexes.sql        # Performance indexes
5. 004_add_contra_voucher_fields.sql      # Contra voucher support
6. 005_enhance_cheques_table.sql          # Cheque management
7. 006_enhance_advance_payables_table.sql # Advance payables
8. 007_add_currency_settings.sql          # Multi-currency support
9. 008_material_purchase_payment_tracking.sql  # Purchase module
10. 009_add_account_head_hierarchy.sql    # Account hierarchy
11. 010_add_bank_and_categories.sql       # Bank accounts
12. 011_add_roles_and_permissions.sql     # RBAC system
13. 012_add_voucher_details.sql           # Voucher enhancements
14. 013_enhance_sales_module.sql          # Sales module
15. 014_add_product_types_and_utilities.sql    # Product types
16. 015_add_pdf_images.sql                # PDF support
17. 016_account_code_constraints.sql      # Account code validation
18. 017_add_vendor_code.sql               # Vendor code system
19. 018_add_reference_party_fields.sql    # Reference party system
```

**Running Migrations:**
```bash
# Using psql directly
psql -h $HOST -U $USER -d $DATABASE -f scripts/001_create_database_schema.sql
psql -h $HOST -U $USER -d $DATABASE -f scripts/002_add_accounting_fields.sql
# ... continue with all files in order

# Or using TypeScript migration runner (if created)
pnpm run migrate
```

### Testing Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts']
    }
})
```

**Running Tests:**
```bash
# Run all tests once
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific test file
pnpm run test src/lib/voucher-utils.test.ts

# Run with coverage
pnpm run test --coverage
```

---

## Performance Considerations

### Database Optimization

1. **Indexes Created:**
   - `idx_users_role_id`
   - `idx_employees_role_id`
   - `idx_role_permissions_*` (3 indexes)
   - `idx_income_expense_heads_*` (3 indexes)
   - `idx_po_*` (5 indexes)
   - `idx_delivery_*` (5 indexes)
   - `idx_sales_*` (multiple)

2. **Query Patterns:**
   - Use prepared statements to prevent SQL injection
   - Leverage indexes for WHERE, JOIN, ORDER BY clauses
   - Paginate list queries (default: 10 items/page)
   - Use SELECT specific columns, not SELECT *

3. **Slow Query Logging:**
   ```typescript
   // Queries >= 200ms are logged
   if (duration >= 200) {
       console.warn(`[db] slow query: ${duration}ms`)
   }
   ```

### Frontend Performance

1. **React Query Caching:**
   - Default stale time: 5 minutes
   - Cache queries by key for automatic deduplication
   - Background refetching enabled

2. **Code Splitting:**
   - Dynamic imports for heavy modules
   - Route-based code splitting with Next.js

3. **Bundle Size:**
   - Tree-shaking enabled for dependencies
   - Radix UI components imported selectively
   - Optional chaining and nullish coalescing

### Monitoring & Instrumentation

1. **Error Tracking:**
   - API errors logged with request ID
   - Database errors include query preview
   - Frontend errors caught and logged

2. **Performance Metrics:**
   - Page load time tracked
   - API response time logged
   - Database query timing captured

---

## Security Considerations

### Authentication & Authorization

1. **Session Security:**
   - HTTP-only cookies (cannot be accessed by JavaScript)
   - Secure flag set in production
   - SameSite=Strict to prevent CSRF

2. **Password Security:**
   - Bcryptjs for password hashing (10 rounds)
   - No passwords logged or displayed
   - Password reset via email (not implemented yet)

3. **Permission Enforcement:**
   - All API endpoints check user permissions
   - Frontend permission gates prevent unauthorized UI
   - Deleted/archived records soft-deleted, not hard-deleted

### Data Protection

1. **SQL Injection Prevention:**
   - Parameterized queries using Neon tagged templates
   - Never construct SQL strings with user input

2. **Input Validation:**
   - All inputs validated with Zod schemas
   - File uploads size-limited
   - Whitelist of allowed file types

3. **API Security:**
   - All sensitive endpoints require authentication
   - Rate limiting recommended (not implemented)
   - CORS configured appropriately

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **No offline support** - Application requires internet connection
2. **No real-time sync** - Data updates require page refresh or manual refetch
3. **Limited file formats** - Supports CSV import only, no Excel/PDF
4. **No document workflow** - No approval workflows for vouchers/POs
5. **Basic search** - No full-text search or advanced filtering
6. **No API key authentication** - Only session-based auth
7. **Single timezone** - No timezone support, uses server timezone

### Recommended Enhancements

1. **Two-Factor Authentication (2FA)**
   - TOTP-based or SMS-based
   - Recommended for production

2. **Audit Logging**
   - Track all user actions with timestamps
   - Immutable audit trail for compliance

3. **Document Management**
   - OCR for document uploads
   - Document versioning and approval workflows

4. **Advanced Search**
   - Full-text search using PostgreSQL FTS
   - Elasticsearch integration for large datasets

5. **Real-Time Updates**
   - WebSocket support via Socket.io
   - Live notifications for new records

6. **Multi-Tenancy**
   - Support for multiple companies
   - Isolated data per tenant

7. **Mobile Application**
   - React Native app for iOS/Android
   - Offline data sync

8. **API Gateway**
   - GraphQL API for flexible querying
   - REST API v2 with versioning

9. **Advanced Analytics**
   - Business intelligence dashboard
   - Predictive analytics for sales forecasting

10. **Integration Hub**
    - Zapier/Integromat integration
    - Accounting software integrations (Xero, FreshBooks)

---

## Conclusion

Abashon ERP is a comprehensive, production-ready system for managing real estate operations. The architecture is modular, scalable, and follows modern web development best practices using Next.js, TypeScript, and PostgreSQL.

All business logic is encapsulated in utility functions and hooks, making it easy to maintain, test, and extend. The permission system provides fine-grained control, and the data model supports complex real estate workflows from lead management through handover.

**Last Updated:** May 30, 2026  
**Repository:** GitHub (contact maintainers for access)  
**Live Demo:** https://abashon-erp-real-estate.vercel.app/
