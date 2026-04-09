import React from 'react'
import { 
  CustomerReceipt, 
  VendorPayment, 
  JournalVoucher, 
  CashMemo 
} from './index'

/*
 * STANDARD ERP DOCUMENT USAGE EXAMPLES
 * 
 * This file demonstrates how to properly use the 4 standard ERP templates
 * in your business workflow for professional document generation.
 */

// =============================================================================
// 1. CUSTOMER RECEIPT EXAMPLE (External Document)
// Use when: Customer pays you money
// Purpose: Give to customer as proof of payment received
// =============================================================================

export function CustomerReceiptExample() {
  return (
    <CustomerReceipt
      receiptNumber="MR-2026-001"
      date="13/02/2026"
      customerName="Ahmed Trading Company"
      customerAddress="House 45, Road 12, Dhanmondi, Dhaka-1209"
      amount={25000}
      amountInWords="Twenty Five Thousand Taka Only"
      description="Construction material supply charges"
      paymentMethod="Bank Transfer"
      bankName="Dutch Bangla Bank Ltd"
      receivedBy="Mohammad Rahman"
      companyName="Kuddus Holdings Ltd"
      companyAddress="Plot 123, Gulshan Avenue, Dhaka-1212"
      companyPhone="+8801712345678"
      companyEmail="info@kuddusholdings.com"
    />
  )
}

// =============================================================================
// 2. VENDOR PAYMENT EXAMPLE (External Document)  
// Use when: You pay money to vendors/suppliers
// Purpose: Give to vendor as confirmation of payment made
// =============================================================================

export function VendorPaymentExample() {
  return (
    <VendorPayment
      paymentNumber="VP-2026-001"
      date="13/02/2026"
      vendorName="Steel & Cement Suppliers Ltd"
      vendorAddress="Warehouse 7, Tejgaon Industrial Area, Dhaka"
      amount={85000}
      amountInWords="Eighty Five Thousand Taka Only"
      description="Monthly cement and steel rod supply"
      paymentMethod="Cheque"
      chequeNumber="CH-789456"
      bankName="Islami Bank Bangladesh Ltd"
      authorizedBy="Kuddus Nur (Managing Director)"
      companyName="Kuddus Holdings Ltd"
      companyAddress="Plot 123, Gulshan Avenue, Dhaka-1212"
      companyPhone="+8801712345678"
      companyEmail="accounts@kuddusholdings.com"
    />
  )
}

// =============================================================================
// 3. JOURNAL VOUCHER EXAMPLE (Internal Document)
// Use when: Making accounting entries for bookkeeping
// Purpose: Internal accounting records with proper debit/credit entries
// =============================================================================

export function JournalVoucherExample() {
  const journalEntries = [
    {
      accountName: "Cash in Hand",
      accountType: "Asset", 
      debitAmount: 25000,
      creditAmount: undefined,
      narration: "Cash received from Ahmed Trading"
    },
    {
      accountName: "Construction Revenue",
      accountType: "Income",
      debitAmount: undefined,
      creditAmount: 25000,
      narration: "Revenue from material supply"
    }
  ]

  return (
    <JournalVoucher
      voucherNumber="JV-2026-001"
      date="13/02/2026"
      entries={journalEntries}
      narration="Cash received from Ahmed Trading Company for construction material supply as per invoice INV-001. Payment received via bank transfer and deposited to cash account."
      preparedBy="Mohammad Rahman (Accountant)"
      checkedBy="Fatima Khatun (Senior Accountant)"
      approvedBy="Kuddus Nur (Managing Director)"
      companyName="Kuddus Holdings Ltd"
      companyAddress="Plot 123, Gulshan Avenue, Dhaka-1212"
      companyPhone="+8801712345678"
      companyEmail="accounts@kuddusholdings.com"
    />
  )
}

// =============================================================================
// 4. CASH MEMO EXAMPLE (External Document)
// Use when: Selling products/services to customers
// Purpose: Itemized sales receipt for customer
// =============================================================================

export function CashMemoExample() {
  const saleItems = [
    {
      serial: 1,
      description: "Portland Cement - Premium Grade",
      quantity: 50,
      unit: "Bags",
      rate: 650,
      amount: 32500
    },
    {
      serial: 2,
      description: "Steel Rod - 12mm Grade 60",
      quantity: 20,
      unit: "Pieces",
      rate: 2800,
      amount: 56000
    },
    {
      serial: 3,
      description: "Transportation & Loading Charges",
      quantity: 1,
      unit: "Service",
      rate: 3500,
      amount: 3500
    }
  ]

  return (
    <CashMemo
      memoNumber="CM-2026-001"
      date="13/02/2026"
      customerName="Green Valley Construction"
      customerAddress="Site Office: Uttara Sector 12, Dhaka"
      customerPhone="+8801987654321"
      items={saleItems}
      subtotal={92000}
      discountAmount={2000}
      taxAmount={4500}
      totalAmount={94500}
      amountInWords="Ninety Four Thousand Five Hundred Taka Only"
      paymentMethod="Cash"
      salesPerson="Abdul Karim"
      notes="Delivery completed successfully. Materials inspected and approved by site engineer. 7 days warranty on cement quality."
      companyName="Kuddus Holdings Ltd"
      companyAddress="Plot 123, Gulshan Avenue, Dhaka-1212"
      companyPhone="+8801712345678"
      companyEmail="sales@kuddusholdings.com"
    />
  )
}

// =============================================================================
// BUSINESS WORKFLOW INTEGRATION GUIDE
// =============================================================================

/*

COMPLETE ERP WORKFLOW EXAMPLE:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO: Customer orders construction materials worth ৳94,500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: SALES TRANSACTION
├─ Generate: CASH MEMO (CashMemoExample)
├─ Give to: Customer (External)
├─ Purpose: Itemized sales receipt
└─ Action: Customer keeps this for their records

STEP 2: ACCOUNTING ENTRY  
├─ Generate: JOURNAL VOUCHER 
├─ Entries: Dr. Cash ৳94,500 | Cr. Sales Revenue ৳94,500
├─ Use by: Internal Accounting Department
└─ Purpose: Proper bookkeeping with debit/credit

STEP 3: CUSTOMER PAYMENT CONFIRMATION
├─ Generate: CUSTOMER RECEIPT (CustomerReceiptExample)  
├─ Give to: Customer (External)
├─ Purpose: Official payment acknowledgment
└─ Action: Both parties keep copies

STEP 4: VENDOR PAYMENTS (If buying materials)
├─ Generate: VENDOR PAYMENT (VendorPaymentExample)
├─ Give to: Supplier (External) 
├─ Purpose: Proof of payment made to supplier
└─ Action: Supplier acknowledges receipt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCUMENT AUDIENCE:
├─ EXTERNAL (Customer-facing): Cash Memo, Customer Receipt, Vendor Payment  
└─ INTERNAL (Accounting-only): Journal Voucher

PROFESSIONAL BENEFITS:
├─ Customers get clean, professional receipts
├─ Vendors get proper payment confirmations  
├─ Accounting gets detailed internal records
├─ All documents are print-ready and legal
└─ Follows international ERP standards

IMPLEMENTATION:
Use these templates in your Next.js pages to generate PDFs
with Puppeteer or similar PDF generation libraries.

*/