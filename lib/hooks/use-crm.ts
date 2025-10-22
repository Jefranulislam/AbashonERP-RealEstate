import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateLeadInput, Lead, LeadFilterInput, UpdateLeadInput } from "@/lib/validations/crm"

// Query keys
export const crmKeys = {
  all: ["crm"] as const,
  leads: () => [...crmKeys.all, "leads"] as const,
  lead: (id: number) => [...crmKeys.leads(), id] as const,
  leadsList: (filters: LeadFilterInput) => [...crmKeys.leads(), filters] as const,
}

// Fetch all leads with filters
export function useLeads(filters: LeadFilterInput = {}) {
  return useQuery({
    queryKey: crmKeys.leadsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.filter) params.append("filter", filters.filter)
      if (filters.search) params.append("search", filters.search)

      const response = await fetch(`/api/crm/leads?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch leads")
      const data = await response.json()
      return data.leads as Lead[]
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

// Fetch single lead
export function useLead(id: number) {
  return useQuery({
    queryKey: crmKeys.lead(id),
    queryFn: async () => {
      const response = await fetch(`/api/crm/leads/${id}`)
      if (!response.ok) throw new Error("Failed to fetch lead")
      const data = await response.json()
      return data.lead as Lead
    },
    enabled: !!id,
  })
}

// Create lead mutation
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLeadInput) => {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create lead")
      }
      return response.json()
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ 
        queryKey: crmKeys.leads(),
        refetchType: 'active' 
      })
      // Force refetch all lead queries
      await queryClient.refetchQueries({ 
        queryKey: crmKeys.leads(),
        type: 'active' 
      })
    },
  })
}

// Update lead mutation
export function useUpdateLead(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateLeadInput) => {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update lead")
      }
      return response.json()
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: crmKeys.leads() })
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData({ queryKey: crmKeys.leads() })
      
      // Optimistically update all lead queries
      queryClient.setQueriesData({ queryKey: crmKeys.leads() }, (old: any) => {
        if (!old) return old
        return old.map((lead: Lead) => 
          lead.id === id ? { ...lead, ...newData } : lead
        )
      })
      
      return { previousLeads }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: async () => {
      // Refetch after mutation
      await queryClient.invalidateQueries({ queryKey: crmKeys.leads() })
      await queryClient.refetchQueries({ queryKey: crmKeys.leads(), type: 'active' })
    },
  })
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete lead")
      }
      return response.json()
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: crmKeys.leads() })
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData({ queryKey: crmKeys.leads() })
      
      // Optimistically remove from all queries
      queryClient.setQueriesData({ queryKey: crmKeys.leads() }, (old: any) => {
        if (!old) return old
        return old.filter((lead: Lead) => lead.id !== id)
      })
      
      return { previousLeads }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: async () => {
      // Refetch after mutation completes
      await queryClient.invalidateQueries({ queryKey: crmKeys.leads() })
      await queryClient.refetchQueries({ queryKey: crmKeys.leads(), type: 'active' })
    },
  })
}

// Convert lead to customer mutation
export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crm/leads/${id}/convert`, {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to convert lead")
      }
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: crmKeys.leads() })
      await queryClient.invalidateQueries({ queryKey: ["customers"] })
      await queryClient.refetchQueries({ queryKey: crmKeys.leads(), type: 'active' })
    },
  })
}

// Bulk import leads mutation
export function useImportLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leads: CreateLeadInput[]) => {
      const response = await fetch("/api/crm/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import leads")
      }
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: crmKeys.leads() })
      await queryClient.refetchQueries({ queryKey: crmKeys.leads(), type: 'active' })
    },
  })
}

// Fetch employees (needed for assignment dropdowns)
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      return data.employees || []
    },
  })
}

// Fetch settings (for lead statuses and sources)
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      return data.settings || null
    },
  })
}
