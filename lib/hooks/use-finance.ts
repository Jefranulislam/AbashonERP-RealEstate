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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false, // ✅ Use cached data on mount
    refetchOnWindowFocus: false, // ✅ Don't refetch on tab switch
    gcTime: 10 * 60 * 1000, // ✅ Keep in cache for 10 minutes
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
      // ✅ Only invalidate - React Query will refetch automatically if the component is mounted
      queryClient.invalidateQueries({ queryKey: ["finance-types"] })
      toast({ title: "Success", description: "Finance type created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useUpdateFinanceType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description?: string; isActive?: boolean } }) => {
      const res = await fetch(`/api/finance/types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update finance type")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance-types"] })
      
      toast({ title: "Success", description: "Finance type updated successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useDeleteFinanceType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/finance/types/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete finance type")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance-types"] })
      
      toast({ title: "Success", description: "Finance type deleted successfully" })
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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false, // ✅ Use cached data on mount
    refetchOnWindowFocus: false, // ✅ Don't refetch on tab switch
    gcTime: 10 * 60 * 1000, // ✅ Keep in cache for 10 minutes
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
      
      toast({ title: "Success", description: "Expense head created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useUpdateExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        headName: string
        incExpTypeId?: number
        description?: string
        isActive?: boolean
      }
    }) => {
      const res = await fetch(`/api/finance/expense-heads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update expense head")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expense-heads"] })
      
      toast({ title: "Success", description: "Expense head updated successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useDeleteExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/finance/expense-heads/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete expense head")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expense-heads"] })
      
      toast({ title: "Success", description: "Expense head deleted successfully" })
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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false, // ✅ Use cached data on mount
    refetchOnWindowFocus: false, // ✅ Don't refetch on tab switch
    gcTime: 10 * 60 * 1000, // ✅ Keep in cache for 10 minutes
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
      
      toast({ title: "Success", description: "Account created successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useUpdateBankCashAccount() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        accountTitle: string
        accountNumber?: string
        bankName?: string
        branch?: string
        description?: string
        isActive?: boolean
      }
    }) => {
      const res = await fetch(`/api/finance/bank-cash/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update bank/cash account")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank-cash-accounts"] })
      
      toast({ title: "Success", description: "Account updated successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useDeleteBankCashAccount() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/finance/bank-cash/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete bank/cash account")
      }
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank-cash-accounts"] })
      
      toast({ title: "Success", description: "Account deleted successfully" })
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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
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

export function useUpdateInitialBankCash() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        bankCashId: number
        initialBalance: number
        date: string
        isConfirmed?: boolean
      }
    }) => {
      const res = await fetch(`/api/initial-bank-cash/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-bank-cash"] })
      toast({ title: "Success", description: "Initial balance updated successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useDeleteInitialBankCash() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/initial-bank-cash/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-bank-cash"] })
      toast({ title: "Success", description: "Initial balance deleted successfully" })
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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
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

export function useUpdateInitialExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        projectId: number
        expenseHeadId: number
        initialBalance: number
        date: string
        isConfirmed?: boolean
      }
    }) => {
      const res = await fetch(`/api/initial-expense-heads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-expense-heads"] })
      toast({ title: "Success", description: "Initial balance updated successfully" })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })
}

export function useDeleteInitialExpenseHead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/initial-expense-heads/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete initial balance")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-expense-heads"] })
      toast({ title: "Success", description: "Initial balance deleted successfully" })
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
    staleTime: 5 * 60 * 1000, // ✅ Data fresh for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  })
}
