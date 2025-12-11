# 🏗️ Material Purchase & Payment Tracking System - Implementation Plan

## 📋 Overview

Complete end-to-end tracking system for construction materials from requisition to final payment, including:
- **Material Details** (Sand, Steel, Cement, etc.)
- **Purchase Confirmation** tracking
- **Delivery Details** (Date, Time, Slip Number)
- **Payment Tracking** (Advance, Partial, Due, Final Payment)
- **Vendor/Supplier** tracking
- **Complete Lifecycle** of every transaction

---

## 🔄 Current System vs Required System

### Current System:
1. Purchase Requisition → 2. Confirmation → **ENDS**

### Required System:
1. **Purchase Requisition** (What to buy, from which vendor)
2. **Purchase Confirmation** (Approved to buy)
3. **Purchase Order** (Formal order to vendor with terms)
4. **Advance Payment** (If paid before delivery)
5. **Delivery Receipt** (Material received with delivery slip, date, time)
6. **Quality Check** (Material inspection)
7. **Partial Payment** (Pay some amount)
8. **Final Payment** (Pay remaining due)
9. **Accounting Integration** (All payments reflected in vouchers)
10. **Reports** (Track every material, every payment, every due)

---

## 🗃️ Database Schema Changes Needed

### 1. Enhanced Purchase Requisition Items
**Add material-specific fields:**
```sql
ALTER TABLE purchase_requisition_items ADD COLUMN IF NOT EXISTS
  material_type VARCHAR(100),           -- 'Sand', 'Steel', 'Cement', 'Bricks', etc.
  material_specification TEXT,          -- Details: Grade, Size, Quality
  unit_of_measurement VARCHAR(50),      -- 'CFT', 'KG', 'TON', 'BAG', 'PIECE'
  vendor_id INTEGER REFERENCES vendors(id),
  delivery_location TEXT,               -- Where to deliver
  urgency_level VARCHAR(20);            -- 'Normal', 'Urgent', 'Critical'
```

### 2. NEW TABLE: Purchase Orders
```sql
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id INTEGER REFERENCES purchase_requisitions(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    payment_terms TEXT,                 -- '50% Advance, 50% on Delivery'
    terms_and_conditions TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    subtotal DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',  -- 'Draft', 'Sent', 'Acknowledged', 'Cancelled'
    notes TEXT,
    prepared_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. NEW TABLE: Purchase Order Items
```sql
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    requisition_item_id INTEGER REFERENCES purchase_requisition_items(id),
    expense_head_id INTEGER REFERENCES income_expense_heads(id),
    material_type VARCHAR(100),
    material_specification TEXT,
    description TEXT,
    qty DECIMAL(10, 2) NOT NULL,
    unit_of_measurement VARCHAR(50),
    rate DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    delivered_qty DECIMAL(10, 2) DEFAULT 0,
    remaining_qty DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. NEW TABLE: Material Deliveries
```sql
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
    delivery_slip_number VARCHAR(100),  -- Vendor's delivery challan number
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    
    -- Received Details
    received_by INTEGER REFERENCES users(id),
    received_date DATE NOT NULL,
    received_time TIME,
    
    -- Material Details
    material_type VARCHAR(100),
    ordered_qty DECIMAL(10, 2),
    delivered_qty DECIMAL(10, 2),
    accepted_qty DECIMAL(10, 2),       -- After quality check
    rejected_qty DECIMAL(10, 2),       -- Failed quality check
    shortage_qty DECIMAL(10, 2),       -- Missing quantity
    unit_of_measurement VARCHAR(50),
    
    -- Quality Check
    quality_status VARCHAR(50),         -- 'Pending', 'Passed', 'Failed', 'Partial'
    quality_checked_by INTEGER REFERENCES users(id),
    quality_check_date DATE,
    quality_remarks TEXT,
    quality_photos TEXT[],              -- Array of photo URLs
    
    -- Storage Details
    storage_location TEXT,
    warehouse_section VARCHAR(100),
    
    -- Status
    delivery_status VARCHAR(50) DEFAULT 'Pending',  -- 'Pending', 'Received', 'Inspected', 'Accepted', 'Rejected'
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. NEW TABLE: Payment Schedules (for each Purchase Order)
```sql
CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id),
    schedule_number VARCHAR(50),
    
    -- Payment Details
    payment_type VARCHAR(50),           -- 'Advance', 'On Delivery', 'After Delivery', 'Final', 'Installment'
    payment_percentage DECIMAL(5, 2),
    scheduled_amount DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    
    -- Payment Status
    status VARCHAR(50) DEFAULT 'Pending',  -- 'Pending', 'Partial', 'Paid', 'Overdue'
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    due_amount DECIMAL(15, 2),
    
    -- Conditions
    payment_condition TEXT,             -- 'On Order', 'On Delivery', '30 Days After Delivery'
    is_conditional BOOLEAN DEFAULT false,
    condition_met BOOLEAN DEFAULT false,
    condition_met_date DATE,
    
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. NEW TABLE: Payment Transactions (Actual Payments Made)
```sql
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id),
    delivery_id INTEGER REFERENCES material_deliveries(id),
    schedule_id INTEGER REFERENCES payment_schedules(id),
    vendor_id INTEGER REFERENCES vendors(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Payment Details
    payment_date DATE NOT NULL,
    payment_time TIME,
    payment_type VARCHAR(50),           -- 'Advance', 'Partial', 'Full', 'Due Settlement'
    payment_method VARCHAR(50),         -- 'Cash', 'Bank Transfer', 'Cheque', 'Mobile Banking'
    amount DECIMAL(15, 2) NOT NULL,
    
    -- Bank/Cheque Details
    bank_account_id INTEGER REFERENCES bank_cash_accounts(id),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    transaction_reference VARCHAR(100),
    
    -- Linked Accounting
    voucher_id INTEGER REFERENCES vouchers(id),  -- Link to debit voucher
    
    -- Receipt Details
    receipt_number VARCHAR(50),
    receipt_issued_by VARCHAR(255),
    receipt_date DATE,
    
    -- Status & Tracking
    payment_status VARCHAR(50) DEFAULT 'Pending',  -- 'Pending', 'Completed', 'Failed', 'Reversed'
    verified_by INTEGER REFERENCES users(id),
    verification_date DATE,
    
    remarks TEXT,
    attachments TEXT[],                 -- Receipt images, bank slips, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. NEW TABLE: Payment History (Track all payment changes)
```sql
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payment_transactions(id),
    action_type VARCHAR(50),            -- 'Created', 'Modified', 'Verified', 'Reversed'
    changed_by INTEGER REFERENCES users(id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_amount DECIMAL(15, 2),
    new_amount DECIMAL(15, 2),
    reason TEXT,
    ip_address VARCHAR(50)
);
```

### 8. Enhanced Income/Expense Heads (Material Categories)
```sql
ALTER TABLE income_expense_heads ADD COLUMN IF NOT EXISTS
  head_category VARCHAR(100),          -- 'Raw Material', 'Labor', 'Equipment', 'Service'
  material_type VARCHAR(100),          -- 'Sand', 'Steel', 'Cement' (if head_category is 'Raw Material')
  default_unit VARCHAR(50),            -- Default unit of measurement
  is_inventory_tracked BOOLEAN DEFAULT false,
  current_stock DECIMAL(15, 2) DEFAULT 0,
  reorder_level DECIMAL(15, 2),
  average_rate DECIMAL(15, 2);
```

---

## 📱 New UI Pages/Features Required

### 1. **Enhanced Purchase Requisition Page**
**Path:** `app/dashboard/purchase/requisitions/page.tsx`

**Add Fields:**
- Material Type dropdown (Sand, Steel, Cement, Bricks, etc.)
- Material Specification (Grade, Size, Quality)
- Unit of Measurement
- Preferred Vendor selection
- Delivery Location
- Urgency Level

**Example Form:**
```typescript
Material Type: [Dropdown: Sand, Steel, Cement, Bricks, etc.]
Specification: [Text: Grade 60, 10mm size]
Quantity: [Number: 100]
Unit: [Dropdown: CFT, KG, TON, BAG]
Rate: [Number: 5000]
Preferred Vendor: [Dropdown: Vendors list]
Delivery Location: [Text: Site A, Block 2]
Urgency: [Radio: Normal, Urgent, Critical]
```

---

### 2. **NEW PAGE: Purchase Orders**
**Path:** `app/dashboard/purchase/orders/page.tsx`

**Features:**
- Create PO from confirmed requisition
- Add vendor details
- Set payment terms (e.g., "30% Advance, 70% on Delivery")
- Add terms and conditions
- Generate PDF (professional format)
- Send to vendor via email
- Track PO status (Draft → Sent → Acknowledged)

**Workflow:**
```
Requisition Confirmed → Create PO → Add Terms → Generate PDF → Send to Vendor → Track Status
```

---

### 3. **NEW PAGE: Material Deliveries**
**Path:** `app/dashboard/purchase/deliveries/page.tsx`

**Features:**
- Record delivery receipt
- Capture delivery slip details
- Quality check form
- Upload photos
- Accept/Reject quantities
- Storage location assignment
- Generate GRN (Goods Received Note)

**Form Fields:**
```typescript
PO Number: [Dropdown]
Delivery Date: [Date]
Delivery Time: [Time]
Delivery Slip No: [Text]
Vehicle Number: [Text]
Driver Name: [Text]
Driver Phone: [Text]
Ordered Qty: [Read-only]
Delivered Qty: [Number]
Accepted Qty: [Number]
Rejected Qty: [Number]
Quality Status: [Dropdown: Passed, Failed, Partial]
Quality Remarks: [Textarea]
Photos: [Upload multiple]
Storage Location: [Text]
Received By: [Dropdown: Users]
```

---

### 4. **NEW PAGE: Payment Tracking**
**Path:** `app/dashboard/purchase/payments/page.tsx`

**Features:**
- View all POs with payment status
- Record advance payments
- Record partial payments
- Record final payments
- Track dues
- Payment history
- Generate payment receipts
- Link to accounting vouchers

**Dashboard View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ PO-001 | Vendor: ABC Steel | Total: ৳500,000                    │
│ ├─ Advance Paid:    ৳150,000 (30%) [Paid on 2025-12-01]        │
│ ├─ On Delivery:     ৳200,000 (40%) [Paid on 2025-12-10]        │
│ └─ After Delivery:  ৳150,000 (30%) [DUE - Expected 2025-12-25] │
├─────────────────────────────────────────────────────────────────┤
│ Total Paid: ৳350,000 | Total Due: ৳150,000 | Status: PARTIAL    │
└─────────────────────────────────────────────────────────────────┘
```

**Payment Form:**
```typescript
PO Number: [Dropdown]
Payment Type: [Advance, Partial, Full, Due Settlement]
Payment Date: [Date]
Payment Time: [Time]
Amount: [Number]
Payment Method: [Cash, Bank Transfer, Cheque, Mobile Banking]
Bank Account: [Dropdown if not cash]
Cheque Number: [Text if cheque]
Transaction Reference: [Text]
Receipt Number: [Auto-generated]
Remarks: [Textarea]
Attachments: [Upload receipts/slips]
Create Voucher: [Checkbox: Auto-create Debit Voucher]
```

---

### 5. **NEW PAGE: Payment Due Report**
**Path:** `app/dashboard/purchase/payment-report/page.tsx`

**Features:**
- All pending payments
- Overdue payments (highlighted in red)
- Upcoming payments (within 7 days - highlighted in yellow)
- Payment history
- Vendor-wise dues
- Project-wise dues
- Export to Excel

**Filters:**
```typescript
Project: [Dropdown: All, Project A, Project B]
Vendor: [Dropdown: All, Vendor 1, Vendor 2]
Payment Status: [Dropdown: All, Pending, Overdue, Upcoming]
Date Range: [From Date] to [To Date]
```

**Table Columns:**
```
PO No | Vendor | Material | Total Amount | Paid | Due | Due Date | Days Overdue | Status | Actions
```

---

### 6. **Enhanced Material Details in Account Heads**
**Path:** `app/dashboard/finance/heads/page.tsx`

**Add Fields to Expense Head Form:**
```typescript
Head Name: [Text: Sand - River Sand]
Type: [Dropdown: Expense]
Category: [Dropdown: Raw Material, Labor, Equipment, Service]
Material Type: [Text: Sand] (shown if Category = Raw Material)
Default Unit: [Dropdown: CFT, KG, TON]
Track Inventory: [Checkbox]
Reorder Level: [Number: 500] (if tracked)
Current Stock: [Read-only: Auto-calculated]
Average Rate: [Read-only: Auto-calculated]
```

---

## 🔄 Complete Workflow Example

### Scenario: Buying 100 CFT River Sand

#### Step 1: Create Purchase Requisition
```
Project: KH Tower Phase 1
Material Type: Sand
Specification: River Sand, Fine Grade
Quantity: 100 CFT
Estimated Rate: ৳50 per CFT
Total: ৳5,000
Preferred Vendor: ABC Sand Suppliers
Delivery Location: Site A, Block 2
Urgency: Normal
```
**Status:** Pending Confirmation

---

#### Step 2: Purchase Confirmation
- Manager reviews and approves
- **Status:** Confirmed

---

#### Step 3: Create Purchase Order
```
PO Number: PO-2025-001 (Auto-generated)
Vendor: ABC Sand Suppliers
Items:
  - River Sand: 100 CFT @ ৳50 = ৳5,000
Subtotal: ৳5,000
Tax (5%): ৳250
Total: ৳5,250

Payment Terms:
  - 30% Advance: ৳1,575 (On Order)
  - 50% On Delivery: ৳2,625 (On Material Receipt)
  - 20% After 15 Days: ৳1,050 (15 days after delivery)

Terms & Conditions:
  - Material must pass quality check
  - Delivery within 5 working days
  - Return policy for rejected material
```
**Generate PDF → Send to Vendor → Status:** Sent

---

#### Step 4: Advance Payment
```
Payment Number: PAY-2025-001
PO Number: PO-2025-001
Payment Type: Advance
Payment Date: 2025-12-05
Amount: ৳1,575
Payment Method: Bank Transfer
Bank Account: DBBL Main Account
Transaction Reference: TXN123456
Create Voucher: ✓ (Auto-creates Debit Voucher)

Accounting Entry (Auto):
  Debit: Sand - River Sand (Expense): ৳1,575
  Credit: Bank Account - DBBL: ৳1,575
```
**Status:** Advance Paid (30%)

---

#### Step 5: Material Delivery
```
Delivery Number: DEL-2025-001
PO Number: PO-2025-001
Delivery Date: 2025-12-10
Delivery Time: 10:30 AM
Delivery Slip No: ABC-SLIP-4567
Vehicle Number: DH-GA-12-3456
Driver: Karim Mia
Driver Phone: 01712345678

Ordered Qty: 100 CFT
Delivered Qty: 98 CFT
Accepted Qty: 95 CFT
Rejected Qty: 3 CFT (Contains mud)
Shortage Qty: 2 CFT

Quality Check:
  Status: Partial Pass
  Checked By: Site Engineer - Hasan
  Remarks: 3 CFT rejected due to mud content. 2 CFT shortage.
  Photos: [3 images uploaded]
  
Storage Location: Site A, Warehouse Section B
Received By: Store Keeper - Ali
```
**Status:** Delivered & Inspected

---

#### Step 6: Delivery Payment
```
Payment Number: PAY-2025-002
PO Number: PO-2025-001
Payment Type: On Delivery (Adjusted for rejection)
Payment Date: 2025-12-10
Calculation:
  - 50% of ৳5,250 = ৳2,625
  - Less: Rejected 3 CFT @ ৳50 = ৳150
  - Less: Shortage 2 CFT @ ৳50 = ৳100
  - Adjusted Amount: ৳2,375
Amount: ৳2,375
Payment Method: Cash
Receipt Number: REC-2025-001
Create Voucher: ✓

Accounting Entry (Auto):
  Debit: Sand - River Sand (Expense): ৳2,375
  Credit: Cash in Hand: ৳2,375
```
**Status:** 75% Paid, 25% Due

---

#### Step 7: Final Payment (After 15 Days)
```
Payment Number: PAY-2025-003
PO Number: PO-2025-001
Payment Type: Final Payment (Adjusted)
Payment Date: 2025-12-25
Due Date: 2025-12-25
Calculation:
  - Original: 20% of ৳5,250 = ৳1,050
  - Less: Adjustment for rejection/shortage = ৳250
  - Final Amount: ৳800
Amount: ৳800
Payment Method: Cheque
Cheque Number: CHQ-789456
Bank: City Bank
Create Voucher: ✓

Accounting Entry (Auto):
  Debit: Sand - River Sand (Expense): ৳800
  Credit: Bank Account - City Bank: ৳800
```
**Status:** Fully Paid ✅

---

#### Summary:
```
Original PO Amount: ৳5,250
Adjustments: -৳250 (Rejection & Shortage)
Final Amount: ৳5,000

Payments Made:
  1. Advance (30%): ৳1,575 on 2025-12-05
  2. On Delivery (Adjusted): ৳2,375 on 2025-12-10
  3. Final (Adjusted): ৳800 on 2025-12-25
  Total Paid: ৳4,750

Material Received:
  Ordered: 100 CFT
  Accepted: 95 CFT
  Rate: ৳50 per CFT
  Total Cost: ৳4,750
  Effective Rate: ৳50 per CFT
```

---

## 📊 Reports Required

### 1. **Material-wise Purchase Report**
Shows all purchases grouped by material type:
```
Material Type | Total Qty | Total Amount | Avg Rate | No. of POs | Vendors
Sand         | 500 CFT   | ৳25,000     | ৳50      | 5          | 3
Steel        | 2 TON     | ৳180,000    | ৳90,000  | 2          | 2
Cement       | 100 BAG   | ৳50,000     | ৳500     | 3          | 2
```

### 2. **Vendor-wise Payment Report**
Shows payment status for each vendor:
```
Vendor Name | Total POs | Total Amount | Paid | Due | Overdue
ABC Sand    | 5         | ৳100,000    | ৳80,000 | ৳15,000 | ৳5,000
XYZ Steel   | 3         | ৳500,000    | ৳400,000| ৳100,000| ৳0
```

### 3. **Delivery Status Report**
Shows delivery tracking:
```
PO No | Material | Vendor | Ordered | Delivered | Accepted | Rejected | Status
PO-001| Sand    | ABC    | 100 CFT | 98 CFT   | 95 CFT   | 3 CFT   | Partial
PO-002| Steel   | XYZ    | 2 TON   | 2 TON    | 2 TON    | 0       | Complete
```

### 4. **Payment Due Report**
Shows all pending/overdue payments:
```
PO No | Vendor | Material | Due Amount | Due Date | Days Overdue | Status
PO-001| ABC    | Sand    | ৳5,000    | 2025-12-20| 5 days      | OVERDUE
PO-003| XYZ    | Cement  | ৳10,000   | 2025-12-30| -          | UPCOMING
```

### 5. **Material Stock Report** (If inventory tracking enabled)
Shows current stock levels:
```
Material | Current Stock | Unit | Reorder Level | Status | Avg Rate
Sand     | 450 CFT      | CFT  | 500 CFT      | Below  | ৳50
Steel    | 5 TON        | TON  | 3 TON        | Good   | ৳90,000
Cement   | 80 BAG       | BAG  | 100 BAG      | Below  | ৳500
```

---

## 🔗 Accounting Integration

### Auto-Create Vouchers on Payment

When payment is made, automatically create accounting voucher:

#### Advance Payment:
```
Voucher Type: Debit Voucher
Debit: Advance to Vendor - ABC Sand (Asset): ৳1,575
Credit: Bank Account - DBBL: ৳1,575
Narration: Advance payment for PO-2025-001 (River Sand)
```

#### Delivery Payment:
```
Voucher Type: Debit Voucher
Debit: Sand - River Sand (Expense): ৳2,375
Credit: Cash in Hand: ৳2,375
Narration: Payment on delivery for PO-2025-001
```

#### Final Payment:
```
Voucher Type: Debit Voucher
Debit: Sand - River Sand (Expense): ৳800
Credit: Bank Account - City Bank: ৳800
Narration: Final payment for PO-2025-001
```

#### Adjust Advance:
```
Voucher Type: Journal Voucher
Debit: Sand - River Sand (Expense): ৳1,575
Credit: Advance to Vendor - ABC Sand (Asset): ৳1,575
Narration: Adjusting advance against material delivery PO-2025-001
```

---

## 📱 API Endpoints Required

### Purchase Orders:
```typescript
GET    /api/purchase/orders                  // List all POs
POST   /api/purchase/orders                  // Create PO
GET    /api/purchase/orders/[id]             // Get PO details
PUT    /api/purchase/orders/[id]             // Update PO
DELETE /api/purchase/orders/[id]             // Delete PO
PATCH  /api/purchase/orders/[id]/send        // Send to vendor
PATCH  /api/purchase/orders/[id]/acknowledge // Vendor acknowledged
```

### Deliveries:
```typescript
GET    /api/purchase/deliveries              // List all deliveries
POST   /api/purchase/deliveries              // Record delivery
GET    /api/purchase/deliveries/[id]         // Get delivery details
PUT    /api/purchase/deliveries/[id]         // Update delivery
PATCH  /api/purchase/deliveries/[id]/quality // Quality check
```

### Payments:
```typescript
GET    /api/purchase/payments                // List all payments
POST   /api/purchase/payments                // Record payment
GET    /api/purchase/payments/[id]           // Get payment details
PUT    /api/purchase/payments/[id]           // Update payment
GET    /api/purchase/payments/schedule       // Payment schedules
POST   /api/purchase/payments/schedule       // Create schedule
GET    /api/purchase/payments/due            // All due payments
GET    /api/purchase/payments/history        // Payment history
```

### Reports:
```typescript
GET    /api/reports/purchase/material-wise   // Material-wise report
GET    /api/reports/purchase/vendor-wise     // Vendor-wise report
GET    /api/reports/purchase/delivery-status // Delivery status
GET    /api/reports/purchase/payment-due     // Payment dues
GET    /api/reports/purchase/stock           // Material stock
```

---

## 🎯 Implementation Priority

### Phase 1: Core Functionality (Week 1-2)
1. ✅ Database schema updates
2. ✅ Enhanced Purchase Requisition with material details
3. ✅ Purchase Order creation page
4. ✅ Basic payment tracking

### Phase 2: Delivery & Quality (Week 3-4)
1. ✅ Material delivery recording page
2. ✅ Quality check functionality
3. ✅ Delivery photos upload
4. ✅ GRN generation

### Phase 3: Payment Management (Week 5-6)
1. ✅ Payment schedules
2. ✅ Multiple payment types (Advance, Partial, Final)
3. ✅ Payment history tracking
4. ✅ Auto voucher creation
5. ✅ Payment receipts

### Phase 4: Reports & Analytics (Week 7-8)
1. ✅ Material-wise reports
2. ✅ Vendor-wise reports
3. ✅ Delivery status reports
4. ✅ Payment due reports
5. ✅ Stock tracking reports
6. ✅ Export to Excel

### Phase 5: Advanced Features (Week 9-10)
1. ✅ Email notifications
2. ✅ SMS alerts for overdue
3. ✅ Vendor portal (view PO, submit delivery)
4. ✅ Mobile app for site delivery
5. ✅ Barcode/QR code for materials
6. ✅ Integration with inventory

---

## 📝 Example User Stories

### Story 1: Site Engineer
"As a site engineer, I need to request 50 bags of cement. I want to specify the brand (Holcim), delivery location (Site B, Block 3), and urgency (Urgent). After delivery, I need to inspect and accept/reject based on quality."

### Story 2: Purchase Manager
"As a purchase manager, I need to create a purchase order for approved requisitions, negotiate with vendors, set payment terms (30% advance, 70% on delivery), and track the entire process until final payment."

### Story 3: Accounts Manager
"As an accounts manager, I need to see all pending payments, overdue amounts, and track which vendor needs payment. I also need all payments to automatically create accounting vouchers."

### Story 4: Project Manager
"As a project manager, I need to see material-wise spending on my project, track delivery status, and ensure we're not overspending on any material category."

### Story 5: Store Keeper
"As a store keeper, I need to receive deliveries, check delivery slips, note down any shortages or damages, take photos for records, and update stock levels."

---

## 🚀 Benefits of This System

1. **Complete Transparency:** Track every rupee from requisition to final payment
2. **No Missed Payments:** Payment due alerts, overdue tracking
3. **Quality Control:** Material acceptance/rejection with photos
4. **Vendor Management:** Track vendor performance, delivery times
5. **Accurate Accounting:** Auto-create vouchers, no manual entry errors
6. **Cost Control:** Track material costs, identify overspending
7. **Audit Trail:** Complete history of every transaction
8. **Better Planning:** Stock levels, reorder points, usage patterns
9. **Reduced Disputes:** Delivery slips, quality photos as proof
10. **Compliance:** Proper documentation for tax, audit

---

## 📚 Documentation for Users

A separate comprehensive user guide will be created covering:
- How to create requisition with material details
- How to create and send purchase orders
- How to record deliveries and quality checks
- How to track and make payments
- How to handle advance, partial, and due payments
- How to generate reports
- How to link everything to accounting

---

**Status:** 📋 Planning Complete - Ready for Implementation
**Estimated Timeline:** 10 weeks for full implementation
**Priority:** HIGH - Critical for complete ERP functionality

---

**Next Steps:**
1. Review and approve this plan
2. Start Phase 1 implementation
3. Create database migration scripts
4. Build UI components
5. Implement API endpoints
6. Test end-to-end workflow
7. Create user documentation
8. Train users

