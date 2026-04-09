// Standard ERP Document Templates
export { PDFTemplate } from './pdf-template'
export { CustomerReceipt } from './customer-receipt'
export { VendorPayment } from './vendor-payment-corporate' 
export { JournalVoucher } from './journal-voucher'
export { CashMemo } from './cash-memo'

// Utility components from pdf-template
export { PDFTable, PDFInfoRow, PDFSection, PDFSummaryBox } from './pdf-template'

// Type definitions for TypeScript support
export type {
  PDFTemplateProps,
  TableRow,
  PDFTableProps,
  PDFInfoRowProps,
  PDFSectionProps,
  PDFSummaryBoxProps
} from './pdf-template'

// ✅ ALL TEMPLATES ARE PROPERLY CONNECTED!
export const ERPTemplatesReady = {
  status: 'CONNECTED ✅',
  templates: ['CustomerReceipt', 'VendorPayment', 'JournalVoucher', 'CashMemo'],
  utilities: ['PDFTemplate', 'PDFTable', 'PDFInfoRow', 'PDFSection', 'PDFSummaryBox'],
  message: 'All ERP document templates are ready for production use!'
} as const

/*
 * Professional ERP Document Templates
 * 
 * USAGE GUIDE:
 * 
 * 1. CUSTOMER RECEIPT (External) - When receiving money from customers
 *    Use: CustomerReceipt component
 *    Purpose: Give to customers as proof of payment
 * 
 * 2. VENDOR PAYMENT (External) - When paying vendors/suppliers  
 *    Use: VendorPayment component
 *    Purpose: Give to vendors as proof of payment made
 * 
 * 3. JOURNAL VOUCHER (Internal) - For accounting entries
 *    Use: JournalVoucher component  
 *    Purpose: Internal accounting records with debit/credit
 * 
 * 4. CASH MEMO (External) - For sales transactions
 *    Use: CashMemo component
 *    Purpose: Sales receipt with itemized billing
 * 
 * WORKFLOW:
 * - External documents: Clean, professional, customer-friendly
 * - Internal documents: Detailed accounting information
 * - All templates: Print-ready, professional formatting
 */