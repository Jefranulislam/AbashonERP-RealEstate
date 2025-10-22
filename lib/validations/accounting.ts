import { z } from "zod"

/**
 * Validation schemas for Accounting Module
 * Covers all voucher types: Credit, Debit, Journal, Contra
 */

// Base voucher schema with common fields
const baseVoucherSchema = z.object({
  date: z.string().min(1, "Date is required"),
  particulars: z.string().optional(),
  isConfirmed: z.boolean().default(false),
})

// Credit Voucher Schema (Income/Receipt)
export const creditVoucherSchema = baseVoucherSchema.extend({
  projectId: z.coerce.number().positive("Project is required"),
  expenseHeadId: z.coerce.number().positive("Head of account is required"),
  bankCashId: z.coerce.number().positive("Cash type is required"),
  billNo: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
})

export type CreditVoucherFormData = z.infer<typeof creditVoucherSchema>

// Debit Voucher Schema (Expense/Payment)
export const debitVoucherSchema = baseVoucherSchema.extend({
  projectId: z.coerce.number().positive("Project is required"),
  expenseHeadId: z.coerce.number().positive("Head of accounts is required"),
  bankCashId: z.coerce.number().positive("Cash type is required"),
  billNo: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
})

export type DebitVoucherFormData = z.infer<typeof debitVoucherSchema>

// Journal Voucher Schema (Dual Entry - Dr/Cr)
export const journalVoucherSchema = z.object({
  // Debit side
  drProjectId: z.coerce.number().positive("Debit project is required"),
  drExpenseHeadId: z.coerce.number().positive("Debit head of accounts is required"),
  drAmount: z.coerce.number().positive("Debit amount must be greater than 0"),
  
  // Credit side
  crProjectId: z.coerce.number().positive("Credit project is required"),
  crExpenseHeadId: z.coerce.number().positive("Credit head of accounts is required"),
  crAmount: z.coerce.number().positive("Credit amount must be greater than 0"),
  
  // Common fields
  billNo: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  isConfirmed: z.boolean().default(false),
}).refine((data) => data.drAmount === data.crAmount, {
  message: "Debit and Credit amounts must be equal",
  path: ["crAmount"],
})

export type JournalVoucherFormData = z.infer<typeof journalVoucherSchema>

// Contra Voucher Schema (Bank/Cash Transfer)
export const contraVoucherSchema = z.object({
  projectId: z.coerce.number().positive("Project is required"),
  drBankCashId: z.coerce.number().positive("Debit bank/cash account is required"),
  crBankCashId: z.coerce.number().positive("Credit bank/cash account is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  chequeNumber: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  isConfirmed: z.boolean().default(false),
}).refine((data) => data.drBankCashId !== data.crBankCashId, {
  message: "Debit and Credit accounts must be different",
  path: ["crBankCashId"],
})

export type ContraVoucherFormData = z.infer<typeof contraVoucherSchema>

// Voucher filter schema
export const voucherFilterSchema = z.object({
  projectId: z.coerce.number().optional(),
  voucherType: z.enum(["Credit", "Debit", "Journal", "Contra"]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
})

export type VoucherFilterData = z.infer<typeof voucherFilterSchema>

// Ledger report schema
export const ledgerReportSchema = z.object({
  projectId: z.coerce.number().optional(), // Optional for "All Projects"
  expenseHeadId: z.coerce.number().positive("Expense/Income head is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
})

export type LedgerReportData = z.infer<typeof ledgerReportSchema>

// Cash/Bank Book schema
export const cashBankBookSchema = z.object({
  projectId: z.coerce.number().positive("Project is required"),
  bankCashId: z.coerce.number().positive("Cash or Bank account is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
})

export type CashBankBookData = z.infer<typeof cashBankBookSchema>

// Trial Balance schema
export const trialBalanceSchema = z.object({
  projectId: z.coerce.number().optional(), // Optional for all projects
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
})

export type TrialBalanceData = z.infer<typeof trialBalanceSchema>

// Financial Statement schema (P&L, Balance Sheet, etc.)
export const financialStatementSchema = z.object({
  projectId: z.coerce.number().optional(), // Optional for consolidated
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  comparisonFromDate: z.string().optional(), // For comparative statements
  comparisonToDate: z.string().optional(),
})

export type FinancialStatementData = z.infer<typeof financialStatementSchema>
