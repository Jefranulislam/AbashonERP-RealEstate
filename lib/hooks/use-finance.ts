import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

// ============ Finance Types ============

export function useFinanceTypes() {
  return useQuery({
    queryKey: ["finance-types"],
    queryFn: async () => {
      const res = await fetch("/api/finance/types")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch finance types")
      }
      const data = await res.json()
      return data.types || []
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useCreateFinanceType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isActive?: boolean }) => {
      const res = await fetch("/api/finance/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create finance type")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance-types"] })
      await queryClient.refetchQueries({ queryKey: ["finance-types"], type: 'active' })
      toast({ title: "Success", description: "Finance type created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

// ============ Expense Heads ============

export function useExpenseHeads() {
  return useQuery({
    queryKey: ["expense-heads"],
    queryFn: async () => {
      const res = await fetch("/api/finance/expense-heads")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch expense heads")
      }
      const data = await res.json()
      return data.expenseHeads || []
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useCreateExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      headName: string
      incExpTypeId?: number
      description?: string
      isActive?: boolean
    }) => {
      const res = await fetch("/api/finance/expense-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create expense head")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expense-heads"] })
      await queryClient.refetchQueries({ queryKey: ["expense-heads"], type: 'active' })
      toast({ title: "Success", description: "Expense head created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

// ============ Bank & Cash Accounts ============

export function useBankCashAccounts() {
  return useQuery({
    queryKey: ["bank-cash-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/finance/bank-cash")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch bank/cash accounts")
      }
      const data = await res.json()
      return data.bankCashAccounts || []
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useCreateBankCashAccount() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      accountTitle: string
      accountNumber?: string
      bankName?: string
      branch?: string
      description?: string
      isActive?: boolean
    }) => {
      const res = await fetch("/api/finance/bank-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create bank/cash account")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank-cash-accounts"] })
      await queryClient.refetchQueries({ queryKey: ["bank-cash-accounts"], type: 'active' })
      toast({ title: "Success", description: "Account created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

// ============ Initial Bank Cash Balances ============

export function useInitialBankCash() {
  return useQuery({
    queryKey: ["initial-bank-cash"],
    queryFn: async () => {
      const res = await fetch("/api/initial-bank-cash")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch initial bank/cash balances")
      }
      const data = await res.json()
      return data.initialBankCash || []
    },
  })
}

export function useCreateInitialBankCash() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      bankCashId: number
      initialBalance: number
      date: string
      isConfirmed?: boolean
    }) => {
      const res = await fetch("/api/initial-bank-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to set initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-bank-cash"] })
      toast({ title: "Success", description: "Initial balance set successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

// ============ Initial Expense Head Balances ============

export function useInitialExpenseHeads() {
  return useQuery({
    queryKey: ["initial-expense-heads"],
    queryFn: async () => {
      const res = await fetch("/api/initial-expense-heads")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch initial expense head balances")
      }
      const data = await res.json()
      return data.initialExpenseHeads || []
    },
  })
}

export function useCreateInitialExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      projectId: number
      expenseHeadId: number
      initialBalance: number
      date: string
      isConfirmed?: boolean
    }) => {
      const res = await fetch("/api/initial-expense-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to set initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-expense-heads"] })
      toast({ title: "Success", description: "Initial balance set successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

// ============ Projects (for dropdown) ============

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch projects")
      }
      const data = await res.json()
      return data.projects || []
    },
  })
}
