import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

/**
 * React Query hooks for Accounting Module
 * Handles all voucher types: Credit, Debit, Journal, Contra
 */

// Types
interface Voucher {
  id: number
  voucher_no: string
  voucher_type: "Credit" | "Debit" | "Journal" | "Contra"
  project_id: number
  project_name?: string
  expense_head_id?: number
  expense_head_name?: string
  bank_cash_id?: number
  bank_cash_name?: string
  dr_bank_cash_id?: number
  dr_bank_cash_name?: string
  cr_bank_cash_id?: number
  cr_bank_cash_name?: string
  bill_no?: string
  date: string
  amount: number
  particulars?: string
  description?: string
  cheque_number?: string
  is_confirmed: boolean
  created_at: string
  updated_at?: string
}

interface VoucherFilters {
  projectId?: number
  voucherType?: "Credit" | "Debit" | "Journal" | "Contra"
  fromDate?: string
  toDate?: string
}

// ==================== QUERY HOOKS ====================

/**
 * Fetch all vouchers with optional filtering
 */
export function useVouchers(filters?: VoucherFilters) {
  return useQuery({
    queryKey: ["vouchers", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.projectId) params.append("projectId", filters.projectId.toString())
      if (filters?.voucherType) params.append("voucherType", filters.voucherType)
      if (filters?.fromDate) params.append("fromDate", filters.fromDate)
      if (filters?.toDate) params.append("toDate", filters.toDate)

      const response = await fetch(`/api/accounting/vouchers?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch vouchers")
      
      const data = await response.json()
      return data.vouchers as Voucher[]
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch credit vouchers specifically
 */
export function useCreditVouchers(projectId?: number) {
  return useVouchers({ voucherType: "Credit", projectId })
}

/**
 * Fetch debit vouchers specifically
 */
export function useDebitVouchers(projectId?: number) {
  return useVouchers({ voucherType: "Debit", projectId })
}

/**
 * Fetch journal vouchers specifically
 */
export function useJournalVouchers(projectId?: number) {
  return useVouchers({ voucherType: "Journal", projectId })
}

/**
 * Fetch contra vouchers specifically
 */
export function useContraVouchers(projectId?: number) {
  return useVouchers({ voucherType: "Contra", projectId })
}

/**
 * Fetch single voucher by ID
 */
export function useVoucher(id: number) {
  return useQuery({
    queryKey: ["vouchers", id],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/vouchers/${id}`)
      if (!response.ok) throw new Error("Failed to fetch voucher")
      
      const data = await response.json()
      return data.voucher as Voucher
    },
    enabled: !!id,
  })
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new voucher (any type)
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/accounting/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create voucher")
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      await queryClient.refetchQueries({ queryKey: ["vouchers"], type: 'active' })
      
      toast({
        title: "Success",
        description: `${variables.voucherType} voucher created successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Create credit voucher specifically
 */
export function useCreateCreditVoucher() {
  const createVoucher = useCreateVoucher()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return createVoucher.mutateAsync({
        ...data,
        voucherType: "Credit",
      })
    },
  })
}

/**
 * Create debit voucher specifically
 */
export function useCreateDebitVoucher() {
  const createVoucher = useCreateVoucher()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return createVoucher.mutateAsync({
        ...data,
        voucherType: "Debit",
      })
    },
  })
}

/**
 * Create journal voucher specifically
 */
export function useCreateJournalVoucher() {
  const createVoucher = useCreateVoucher()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return createVoucher.mutateAsync({
        ...data,
        voucherType: "Journal",
      })
    },
  })
}

/**
 * Create contra voucher specifically
 */
export function useCreateContraVoucher() {
  const createVoucher = useCreateVoucher()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return createVoucher.mutateAsync({
        ...data,
        voucherType: "Contra",
      })
    },
  })
}

/**
 * Update existing voucher
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/accounting/vouchers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update voucher")
      }

      return response.json()
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["vouchers"] })
      
      // Snapshot previous value
      const previousVouchers = queryClient.getQueriesData({ queryKey: ["vouchers"] })
      
      // Optimistically update all voucher queries
      queryClient.setQueriesData({ queryKey: ["vouchers"] }, (old: any) => {
        if (!old?.vouchers) return old
        return {
          ...old,
          vouchers: old.vouchers.map((v: Voucher) => 
            v.id === id ? { ...v, ...data } : v
          )
        }
      })
      
      return { previousVouchers }
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousVouchers) {
        context.previousVouchers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
    onSettled: async (_, __, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      await queryClient.invalidateQueries({ queryKey: ["vouchers", variables.id] })
      await queryClient.refetchQueries({ queryKey: ["vouchers"], type: 'active' })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Voucher updated successfully",
      })
    },
  })
}

/**
 * Delete voucher
 */
export function useDeleteVoucher() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/accounting/vouchers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete voucher")
      }

      return response.json()
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["vouchers"] })
      
      // Snapshot previous value
      const previousVouchers = queryClient.getQueriesData({ queryKey: ["vouchers"] })
      
      // Optimistically remove from all queries
      queryClient.setQueriesData({ queryKey: ["vouchers"] }, (old: any) => {
        if (!old?.vouchers) return old
        return {
          ...old,
          vouchers: old.vouchers.filter((v: Voucher) => v.id !== id)
        }
      })
      
      return { previousVouchers }
    },
    onError: (error: Error, id, context) => {
      // Rollback on error
      if (context?.previousVouchers) {
        context.previousVouchers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      await queryClient.refetchQueries({ queryKey: ["vouchers"], type: 'active' })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Voucher deleted successfully",
      })
    },
  })
}

// ==================== REPORT HOOKS ====================

/**
 * Fetch ledger report (Project-wise or All Projects)
 */
export function useLedgerReport(params: {
  projectId?: number
  expenseHeadId: number
  fromDate: string
  toDate: string
}) {
  return useQuery({
    queryKey: ["ledger-report", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.projectId) searchParams.append("projectId", params.projectId.toString())
      searchParams.append("expenseHeadId", params.expenseHeadId.toString())
      searchParams.append("fromDate", params.fromDate)
      searchParams.append("toDate", params.toDate)

      const response = await fetch(`/api/accounting/reports/ledger?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch ledger report")
      
      return response.json()
    },
    enabled: !!params.expenseHeadId && !!params.fromDate && !!params.toDate,
  })
}

/**
 * Fetch cash/bank book
 */
export function useCashBankBook(params: {
  projectId: number
  bankCashId: number
  fromDate: string
  toDate: string
}) {
  return useQuery({
    queryKey: ["cash-bank-book", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        projectId: params.projectId.toString(),
        bankCashId: params.bankCashId.toString(),
        fromDate: params.fromDate,
        toDate: params.toDate,
      })

      const response = await fetch(`/api/accounting/reports/cash-bank-book?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch cash/bank book")
      
      return response.json()
    },
    enabled: !!params.projectId && !!params.bankCashId && !!params.fromDate && !!params.toDate,
  })
}

/**
 * Fetch trial balance
 */
export function useTrialBalance(params: {
  projectId?: number
  fromDate: string
  toDate: string
}) {
  return useQuery({
    queryKey: ["trial-balance", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.projectId) searchParams.append("projectId", params.projectId.toString())
      searchParams.append("fromDate", params.fromDate)
      searchParams.append("toDate", params.toDate)

      const response = await fetch(`/api/accounting/reports/trial-balance?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch trial balance")
      
      return response.json()
    },
    enabled: !!params.fromDate && !!params.toDate,
  })
}

/**
 * Fetch profit & loss statement
 */
export function useProfitLoss(params: {
  projectId?: number
  fromDate: string
  toDate: string
  comparisonFromDate?: string
  comparisonToDate?: string
}) {
  return useQuery({
    queryKey: ["profit-loss", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.projectId) searchParams.append("projectId", params.projectId.toString())
      searchParams.append("fromDate", params.fromDate)
      searchParams.append("toDate", params.toDate)
      if (params.comparisonFromDate) searchParams.append("comparisonFromDate", params.comparisonFromDate)
      if (params.comparisonToDate) searchParams.append("comparisonToDate", params.comparisonToDate)

      const response = await fetch(`/api/accounting/reports/profit-loss?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch profit & loss")
      
      return response.json()
    },
    enabled: !!params.fromDate && !!params.toDate,
  })
}

/**
 * Fetch balance sheet
 */
export function useBalanceSheet(params: {
  asOnDate: string
}) {
  return useQuery({
    queryKey: ["balance-sheet", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.append("asOnDate", params.asOnDate)

      const response = await fetch(`/api/accounting/reports/balance-sheet?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch balance sheet")
      
      return response.json()
    },
    enabled: !!params.asOnDate,
  })
}
