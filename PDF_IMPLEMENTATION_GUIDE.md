# PDF Generation Implementation Guide

## Overview
Implemented comprehensive PDF generation and printing functionality for Purchase, Accounting, and Sales modules in KH ERP.

## Files Created

### 1. Core Utilities
- **`lib/pdf-utils.ts`**: Core PDF generation utilities
  - `getCompanySettings()`: Fetches company settings for PDF headers
  - `printDocument(elementId)`: Triggers browser print dialog
  - `formatCurrency()`: Formats numbers with currency symbol
  - `formatDateForPDF()`: Formats dates for PDF display
  - `exportToCSV()`: Exports data to CSV format
  - `pdfStyles`: CSS styles for print media

### 2. PDF Template Components
- **`components/pdf-template.tsx`**: Reusable PDF template components
  - `PDFTemplate`: Main template with company header/footer
  - `PDFTable`: Formatted table for PDF
  - `PDFInfoRow`: Label-value row for information display
  - `PDFSection`: Section with title for organizing content

### 3. Document-Specific PDF Components

#### Purchase Module
- **`components/pdf/purchase-requisition-pdf.tsx`**
  - Displays requisition header with MPR number, dates
  - Shows project, employee, and contact information
  - Lists all items with expense heads, quantities, rates
  - Includes total amount calculation
  - Shows signature lines for approval workflow

#### Accounting Module
- **`components/pdf/accounting-voucher-pdf.tsx`**
  - Supports all voucher types (Debit, Credit, Contra, Journal)
  - Displays voucher entries with ledger accounts
  - Shows debit/credit columns
  - Validates that debits equal credits
  - Includes narration and approval signatures

#### Sales Module
- **`components/pdf/sales-invoice-pdf.tsx`**
  - Professional invoice layout
  - Customer billing information
  - Itemized product/service listing
  - Subtotal, discount, tax calculations
  - Shows paid amount and balance due
  - Payment status indicator

## Implementation in Pages

### Purchase Requisitions Page
**File**: `app/dashboard/purchase/requisitions/page.tsx`

**Changes Made**:
1. Added imports:
   ```typescript
   import { Printer } from "lucide-react"
   import { PurchaseRequisitionPDF } from "@/components/pdf/purchase-requisition-pdf"
   import { printDocument, getCompanySettings } from "@/lib/pdf-utils"
   ```

2. Added state variables:
   ```typescript
   const [printDialogOpen, setPrintDialogOpen] = useState(false)
   const [companySettings, setCompanySettings] = useState<any>(null)
   ```

3. Added print handler:
   ```typescript
   const handlePrintRequisition = async (requisition: any) => {
     const response = await axios.get(`/api/purchase/requisitions/${requisition.id}`)
     setSelectedRequisition(response.data.requisition)
     setRequisitionItems(response.data.items)
     setPrintDialogOpen(true)
     setTimeout(() => printDocument('print-requisition-content'), 100)
   }
   ```

4. Added Print button in Actions column with Printer icon

5. Added hidden print content div at bottom of component

## How to Use

### For Users
1. Navigate to the module (Purchase/Accounting/Sales)
2. Find the document you want to print
3. Click the **Printer icon** (🖨️) in the Actions column
4. Browser print dialog will open automatically
5. Select printer or "Save as PDF"
6. Adjust print settings if needed
7. Click Print

### For Developers - Adding PDF to New Modules

#### Step 1: Create PDF Component
```typescript
// components/pdf/your-document-pdf.tsx
import { PDFTemplate, PDFTable, PDFSection } from '@/components/pdf-template'
import { formatCurrency, formatDateForPDF } from '@/lib/pdf-utils'

export function YourDocumentPDF({ data, companyName, companyAddress, currencySymbol }) {
  return (
    <PDFTemplate
      title="Your Document Title"
      documentNumber={data.doc_no}
      date={formatDateForPDF(data.date)}
      companyName={companyName}
      companyAddress={companyAddress}
    >
      {/* Your content here */}
    </PDFTemplate>
  )
}
```

#### Step 2: Update Page Component
```typescript
// In your page component
import { Printer } from "lucide-react"
import { YourDocumentPDF } from "@/components/pdf/your-document-pdf"
import { printDocument, getCompanySettings } from "@/lib/pdf-utils"

// Add state
const [printDialogOpen, setPrintDialogOpen] = useState(false)
const [companySettings, setCompanySettings] = useState<any>(null)
const [selectedDocument, setSelectedDocument] = useState<any>(null)

// Load company settings
useEffect(() => {
  loadCompanySettings()
}, [])

const loadCompanySettings = async () => {
  const settings = await getCompanySettings()
  setCompanySettings(settings)
}

// Add print handler
const handlePrint = async (document: any) => {
  setSelectedDocument(document)
  setPrintDialogOpen(true)
  setTimeout(() => printDocument('print-content'), 100)
}

// Add Print button in your table
<Button onClick={() => handlePrint(item)}>
  <Printer className="h-4 w-4" />
</Button>

// Add hidden print div
<div className="hidden">
  {printDialogOpen && selectedDocument && companySettings && (
    <div id="print-content">
      <YourDocumentPDF
        data={selectedDocument}
        companyName={companySettings.company_name}
        companyAddress={companySettings.address}
        currencySymbol={companySettings.currency_symbol}
      />
    </div>
  )}
</div>
```

## Features

### Current Features
- ✅ Browser-based printing (works offline)
- ✅ Professional PDF layout with company branding
- ✅ Automatic page breaks for long content
- ✅ Currency formatting with custom symbols
- ✅ Date formatting (DD-MMM-YYYY)
- ✅ Print-optimized CSS styles
- ✅ Signature lines for approval workflow
- ✅ Company settings integration

### Future Enhancements
- 📋 Export to CSV/Excel
- 📧 Email PDF directly
- 💾 Save PDF to server
- 📱 Mobile-optimized printing
- 🎨 Custom PDF templates per client
- 🔐 Digital signatures
- 📊 Batch printing multiple documents
- 🖼️ Company logo integration

## Modules Ready for PDF

### ✅ Implemented
1. **Purchase Requisitions** - Full print functionality
   - Location: Purchase → Requisitions

### 🔄 Ready to Implement (Components Created)
2. **Accounting Vouchers** - Component ready
   - Debit Voucher
   - Credit Voucher
   - Contra Voucher
   - Journal Voucher

3. **Sales Invoices** - Component ready
   - Sales invoices with itemized billing

### 📝 To Be Implemented
4. **Purchase Orders**
5. **Payment Receipts**
6. **Balance Sheet**
7. **Profit & Loss Statement**
8. **Trial Balance**
9. **Ledger Reports**
10. **Customer Statements**

## Testing

### Test Print Functionality
1. Create a purchase requisition
2. Go to Purchase → Requisitions
3. Click Print icon (🖨️) on any requisition
4. Verify:
   - Company name and address appear
   - All requisition details are correct
   - Items table is properly formatted
   - Currency symbol is correct (৳)
   - Total amount matches
   - Print dialog opens automatically

## Browser Compatibility
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not recommended)

## Print Settings Recommendations
- **Paper Size**: A4
- **Margins**: Normal (1cm all sides)
- **Scale**: 100%
- **Background Graphics**: ON (to see colors)
- **Orientation**: Portrait

## Troubleshooting

### Print dialog doesn't open
- Check browser popup blocker settings
- Ensure JavaScript is enabled
- Try printing from a different browser

### Content is cut off
- Adjust scale in print settings to 90% or 80%
- Check print preview before printing
- Ensure page breaks are working correctly

### Missing styles in print
- Verify CSS is loading correctly
- Check print media queries
- Use "Print backgrounds" option in browser

## Notes for Currency Settings
The PDF system automatically uses the currency settings from Settings page:
- Currency Code (BDT, USD, EUR, etc.)
- Currency Symbol (৳, $, €, etc.)

To change currency:
1. Go to Settings
2. Select desired currency
3. Save settings
4. All PDFs will use new currency

---

**Last Updated**: November 22, 2025
**Author**: KH ERP Development Team
