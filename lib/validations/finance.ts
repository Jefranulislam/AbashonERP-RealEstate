import { z } from "zod"

// Finance Types Schema
export const financeTypeSchema = z.object({
  name: z.string().min(1, "Type name is required").max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type FinanceTypeFormData = z.infer<typeof financeTypeSchema>

// Expense Heads Schema
export const expenseHeadSchema = z.object({
  headName: z.string().min(1, "Head name is required").max(100),
  incExpTypeId: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type ExpenseHeadFormData = z.infer<typeof expenseHeadSchema>

// Bank & Cash Schema
export const bankCashAccountSchema = z.object({
  accountTitle: z.string().min(1, "Account title is required").max(200),
  accountNumber: z.string().max(50).optional(),
  bankName: z.string().max(100).optional(),
  branch: z.string().max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type BankCashAccountFormData = z.infer<typeof bankCashAccountSchema>

// Initial Bank Cash Balance Schema
export const initialBankCashSchema = z.object({
  bankCashId: z.coerce.number().int().positive("Please select an account"),
  initialBalance: z.coerce.number().min(0, "Balance must be positive or zero"),
  date: z.string().min(1, "Date is required"),
  isConfirmed: z.boolean().default(false),
})

export type InitialBankCashFormData = z.infer<typeof initialBankCashSchema>

// Initial Expense Head Balance Schema
export const initialExpenseHeadSchema = z.object({
  projectId: z.coerce.number().int().positive("Please select a project"),
  expenseHeadId: z.coerce.number().int().positive("Please select an expense head"),
  initialBalance: z.coerce.number().min(0, "Balance must be positive or zero"),
  date: z.string().min(1, "Date is required"),
  isConfirmed: z.boolean().default(false),
})

export type InitialExpenseHeadFormData = z.infer<typeof initialExpenseHeadSchema>
