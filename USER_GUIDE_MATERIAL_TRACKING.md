# Quick Start Guide - Material Purchase Tracking System

## 📚 Complete User Guide for Material Purchase Lifecycle

---

## 🎯 System Overview

This system tracks the **complete lifecycle** of material purchases from order to final payment:

```
Purchase Requisition → Purchase Order → Material Delivery → Payments
                            ↓               ↓                ↓
                     Material Details  Quality Check   Voucher Creation
```

---

## 📋 Workflow Steps

### Step 1: Create Purchase Order

**Navigate**: `/dashboard/purchase/orders` → Click "Create Purchase Order"

**Fill Required Information**:

1. **Basic Details**:
   - Select Vendor (required)
   - Select Project (required)
   - Order Date (default: today)
   - Expected Delivery Date (required)
   - Prepared By (required)

2. **Delivery Information**:
   - Delivery Address (required) - where materials will be delivered
   - Contact Person - who will receive
   - Contact Phone

3. **Order Items** (Click "Add Item" for multiple materials):
   - **Expense Head**: Select category (Construction Materials, etc.)
   - **Material Type**: Enter specific material (e.g., "Sand", "Steel", "Cement")
   - **Specification**: Enter details (e.g., "Sylhet Sand", "Grade 60, 20mm")
   - **Unit**: Enter measurement unit (e.g., "CFT", "Ton", "Bag")
   - **Qty**: Enter quantity
   - **Rate**: Enter unit price
   - **Amount**: Auto-calculated

   **Example**:
   ```
   Expense Head: Construction Materials
   Material Type: Sand
   Specification: Sylhet Sand
   Unit: CFT
   Qty: 500
   Rate: 100
   Amount: 50,000 (auto-calculated)
   ```

4. **Totals**:
   - Subtotal: Auto-calculated from all items
   - Discount: Enter if any
   - Tax: Enter if any
   - Total: Auto-calculated final amount

5. **Payment Schedule** (Click "Add Payment" for multiple schedules):
   - **Type**: Select (Advance, Partial, Full, Due Settlement)
   - **Amount**: Enter payment amount
   - **Due Date**: Select when payment is due
   - **Description**: Optional notes

   **Example**:
   ```
   Schedule 1: Advance - ৳45,750 - Due: Today
   Schedule 2: Full - ৳106,750 - Due: After Delivery (7 days)
   ```

6. **Terms & Conditions**:
   - Payment Terms: e.g., "30% advance, 70% on delivery"
   - Delivery Terms: e.g., "FOB", "CIF"
   - Warranty: e.g., "1 Year"
   - Notes: Any additional instructions

**Result**: 
- PO Number auto-generated (e.g., PO-2025-0001)
- Status: Draft → Pending → Approved
- Payment Status: Unpaid

---

### Step 2: Record Material Delivery

**Navigate**: `/dashboard/purchase/deliveries` → Click "Record Delivery"

**Fill Required Information**:

1. **Select Purchase Order**:
   - Choose from approved POs
   - System shows: Vendor, Project, Order Date, Expected Delivery

2. **Delivery Details**:
   - **Delivery Date** (required)
   - **Delivery Time** (required) - e.g., 14:30
   - **Delivery Slip Number** (required) - e.g., DS-2025-001

3. **Vehicle & Driver**:
   - Vehicle Number - e.g., DHK-1234
   - Driver Name
   - Driver Phone

4. **Received By** (required):
   - Select employee who received the delivery

5. **Delivery Items**:
   System shows all PO items with:
   - Material name and specification
   - Ordered quantity
   - Previously delivered (if any)
   - **Remaining quantity** (important!)

   For each item, enter:
   - **Delivered Now** (required) - actual quantity received
   - **Rejected** - damaged/substandard quantity
   - **Accepted** - auto-calculated (delivered - rejected)
   - **Shortage** - auto-calculated if delivered < ordered
   - **Excess** - auto-calculated if delivered > ordered

   **Example**:
   ```
   Material: Sand - Sylhet Sand
   Unit: CFT
   Ordered: 500
   Previously Delivered: 0
   Remaining: 500
   
   Delivered Now: 500 ✓
   Rejected: 0
   Accepted: 500 (auto)
   Shortage: 0 (auto)
   Excess: 0 (auto)
   ```

6. **Quality Check**:
   - **Quality Status**: Select (Pending, Approved, Rejected, Partially Approved)
   - Quality Checked By: Select employee
   - **Storage Location** (required) - e.g., "Warehouse A, Shelf 3"
   - Quality Remarks: Optional inspection notes

7. **Delivery Notes**: Any additional notes

**Result**:
- Delivery Number auto-generated (e.g., DEL-2025-0001)
- PO items updated with delivered quantities
- PO status changes to "Partially Delivered" or "Fully Delivered"

---

### Step 3: Record Payment

**Navigate**: `/dashboard/purchase/payments` → Click "Record Payment"

**Fill Required Information**:

1. **Select Purchase Order**:
   - Choose PO to pay
   - System shows: Vendor, Project, Order Date
   - **Important**: Shows Total Amount, Total Paid, **Remaining Due**

2. **Payment Information**:
   - **Payment Date** (required)
   - **Payment Type** (required):
     - **Advance**: Payment before delivery
     - **Partial**: Part of total amount
     - **Full**: Complete payment
     - **Due Settlement**: Final outstanding amount
   - **Amount** (required): Enter payment amount

3. **Payment Method** (required):
   - **Cash**: Direct cash payment
   - **Bank Transfer**: Electronic transfer
   - **Cheque**: Cheque payment
   - **Mobile Banking**: bKash, Nagad, etc.
   - **Card**: Credit/Debit card

4. **Account Selection**:
   - Select Bank/Cash Account (required for non-cash)

5. **Payment Method Details**:
   - **For Bank Transfer**:
     - Reference Number
     - Transaction ID
   
   - **For Cheque**:
     - Cheque Number (required)
     - Cheque Date (required)
   
   - **For Mobile Banking**:
     - Transaction ID (required)

6. **Authorization**:
   - **Paid By** (required): Employee who made payment
   - Verified By: Employee who verified (optional)

7. **Remarks**:
   - Payment Remarks: Notes about this payment

8. **Auto-Create Voucher** (Toggle):
   - ✅ Enable to auto-create accounting debit voucher
   - Voucher Number: Auto-generated (DV-2025-0001)
   - Voucher Remarks: Optional accounting notes

**Result**:
- Payment Number auto-generated (e.g., PAY-2025-0001)
- Payment schedule updated (paid amount, due amount)
- Status: Pending → Completed → Verified
- Debit voucher created (if enabled)
- PO payment status updated (Unpaid → Partial → Fully Paid)

---

### Step 4: Monitor Due Payments

**Navigate**: `/dashboard/purchase/payment-due-report`

**Dashboard Shows**:
1. **Summary Cards**:
   - Total Pending Payments
   - Total Due Amount
   - Overdue Payments (RED)
   - Due Within 7 Days (YELLOW)

2. **Overdue Alert**:
   - Red banner if any payments overdue
   - Shows count and total amount

3. **Pending Payments Table**:
   - **Urgency Column**: Color-coded
     - 🔴 RED: Overdue
     - 🟡 YELLOW: Due within 7 days
     - ⚪ WHITE: Upcoming
   - PO Number, Vendor, Project
   - Payment Type, Scheduled, Paid, Due amounts
   - Due Date with days calculation
   - Status

4. **Vendor-wise Summary**:
   - Total due per vendor
   - Overdue count per vendor

**Filters Available**:
- Search: PO, vendor, or project name
- Vendor: Filter by specific vendor
- Project: Filter by specific project
- Urgency: Filter by overdue/due-soon/upcoming

**Export**:
- Click "Export to Excel" for CSV download

---

## 🎯 Common Scenarios

### Scenario 1: Full Advance Payment
1. Create PO with total ৳100,000
2. Payment Schedule: Advance - ৳100,000 - Due: Today
3. Record Payment: Type=Advance, Amount=৳100,000
4. Result: PO Payment Status = "Fully Paid" before delivery

### Scenario 2: Partial Payments (30-70)
1. Create PO with total ৳100,000
2. Payment Schedule:
   - Advance - ৳30,000 - Due: Today
   - Full - ৳70,000 - Due: After Delivery
3. Record Payment 1: Type=Advance, Amount=৳30,000
4. Deliver materials
5. Record Payment 2: Type=Due Settlement, Amount=৳70,000
6. Result: PO Payment Status = "Fully Paid"

### Scenario 3: Payment After Delivery (Due)
1. Create PO with total ৳100,000
2. Payment Schedule: Full - ৳100,000 - Due: 30 days after delivery
3. Deliver materials
4. After 30 days: Record Payment: Type=Full, Amount=৳100,000
5. Result: Shows in Payment Due Report for 30 days

### Scenario 4: Partial Delivery with Quality Issues
1. Create PO: 500 CFT Sand
2. First Delivery:
   - Delivered: 300 CFT
   - Rejected: 20 CFT (poor quality)
   - Accepted: 280 CFT
   - Shortage: 200 CFT
3. Second Delivery:
   - Previously Delivered: 280 CFT
   - Remaining: 220 CFT
   - Delivered: 220 CFT
   - Accepted: 220 CFT
4. Result: Total Delivered = 500 CFT (280 + 220)

---

## 💡 Pro Tips

### For Purchase Orders:
- ✅ Always fill Material Type and Specification for accurate tracking
- ✅ Link to requisition if created from purchase requisition
- ✅ Set realistic delivery dates
- ✅ Define clear payment terms in Payment Terms field

### For Deliveries:
- ✅ Record delivery immediately when materials arrive
- ✅ Perform quality check on-site
- ✅ Note storage location for easy material finding
- ✅ Document any shortages or excess immediately

### For Payments:
- ✅ Enable "Auto-Create Voucher" to maintain accounting records
- ✅ Always verify amounts before submitting
- ✅ Keep reference numbers/transaction IDs for audit trail
- ✅ Get payment verified by authorized person

### For Due Monitoring:
- ✅ Check Payment Due Report weekly
- ✅ Set payment reminders for due dates
- ✅ Prioritize overdue payments (red alerts)
- ✅ Contact vendors for upcoming payments (yellow warnings)

---

## 📊 Reports & Views

### Available Information:

**Purchase Orders Page**:
- All POs with status and payment status
- Filter by project, vendor, status
- Search by PO number or vendor
- View complete PO details

**Material Deliveries Page**:
- All deliveries with quality status
- Filter by project, quality status
- Search by delivery number or PO
- View delivery details with quantities

**Payment Transactions Page**:
- All payments with type and status
- Filter by type, status, vendor
- Search by payment number
- View payment details with voucher link

**Payment Due Report**:
- All pending payments with urgency
- Overdue alerts
- Vendor-wise summary
- Export to Excel

---

## ⚠️ Important Notes

### Payment Rules:
- ✅ Can make multiple payments for one PO
- ✅ Can pay before, during, or after delivery
- ✅ Total payments cannot exceed PO total
- ✅ Payment schedule is for planning; actual payments can differ

### Delivery Rules:
- ✅ Can make partial deliveries
- ✅ Can record multiple deliveries for one PO
- ✅ Total delivered cannot exceed ordered (excess tracked separately)
- ✅ Quality check is mandatory

### Status Updates:
- PO Status: Auto-updates based on delivery completion
- Payment Status: Auto-updates based on payment records
- Payment Schedule: Auto-updates when payment recorded

### Auto-Generated Numbers:
- PO Number: PO-YYYY-#### (sequential)
- Delivery Number: DEL-YYYY-#### (sequential)
- Payment Number: PAY-YYYY-#### (sequential)
- Voucher Number: DV-YYYY-#### (sequential, if enabled)

---

## 🆘 Troubleshooting

**Q: Can't find my vendor in dropdown?**
A: Go to `/dashboard/vendors` and add the vendor first.

**Q: Can't select a PO for delivery?**
A: Only "Approved" POs appear in delivery list. Check PO status.

**Q: Can't record payment?**
A: Ensure PO exists and vendor is selected. Check remaining due amount.

**Q: Why is my payment showing as overdue?**
A: The due date in payment schedule has passed. Record the payment to clear the alert.

**Q: How to edit a PO after creation?**
A: Click the view icon (eye) in PO list, then edit button. Can edit draft/pending POs.

**Q: Can I delete a delivery?**
A: Deliveries cannot be deleted to maintain audit trail. Contact admin if correction needed.

---

## ✅ Checklist for Each Transaction

### Before Creating PO:
- [ ] Vendor exists in system
- [ ] Project exists in system
- [ ] Material specifications decided
- [ ] Payment terms agreed with vendor
- [ ] Delivery location confirmed

### Before Recording Delivery:
- [ ] PO is approved
- [ ] Materials physically received
- [ ] Delivery slip obtained from vendor
- [ ] Quality check completed
- [ ] Storage location assigned

### Before Recording Payment:
- [ ] Payment authorized
- [ ] Bank account has sufficient balance
- [ ] Payment method decided
- [ ] Reference numbers ready
- [ ] Accounting voucher needed or not

### Before End of Day:
- [ ] All deliveries recorded
- [ ] All payments entered
- [ ] Check overdue alerts
- [ ] Review upcoming due payments

---

## 📞 Need Help?

- Check this guide first
- Review `PHASE_2_UI_COMPLETE.md` for technical details
- Review `MATERIAL_PURCHASE_TRACKING_IMPLEMENTATION.md` for system design
- Contact system administrator for access issues

---

**System Status**: ✅ Fully Operational
**Last Updated**: December 11, 2025
**Version**: 1.0.0
