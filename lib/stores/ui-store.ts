import { create } from "zustand"

interface UIStore {
  // Dialog states
  dialogs: Record<string, boolean>
  openDialog: (dialogId: string) => void
  closeDialog: (dialogId: string) => void
  toggleDialog: (dialogId: string) => void
  
  // Loading states
  loadingStates: Record<string, boolean>
  setLoading: (key: string, loading: boolean) => void
  
  // Search and filter states
  searchTerms: Record<string, string>
  setSearchTerm: (key: string, term: string) => void
  
  filters: Record<string, any>
  setFilter: (key: string, value: any) => void
  clearFilters: (key: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  dialogs: {},
  openDialog: (dialogId) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [dialogId]: true },
    })),
  closeDialog: (dialogId) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [dialogId]: false },
    })),
  toggleDialog: (dialogId) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [dialogId]: !state.dialogs[dialogId] },
    })),
    
  loadingStates: {},
  setLoading: (key, loading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading },
    })),
    
  searchTerms: {},
  setSearchTerm: (key, term) =>
    set((state) => ({
      searchTerms: { ...state.searchTerms, [key]: term },
    })),
    
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: (key) =>
    set((state) => ({
      filters: { ...state.filters, [key]: undefined },
    })),
}))
