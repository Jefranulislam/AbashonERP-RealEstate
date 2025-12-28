"use client"

import { usePermissions } from "@/lib/providers/permission-provider"

/**
 * Custom hook for checking permissions in React components
 * @returns Permission checking utilities
 */
export function usePermission() {
  const context = usePermissions()
  
  return {
    ...context,
    
    /**
     * Check if user can create in a module
     */
    canCreate: (module: string) => context.hasPermission(module, "create"),
    
    /**
     * Check if user can edit in a module
     */
    canEdit: (module: string) => context.hasPermission(module, "edit"),
    
    /**
     * Check if user can delete in a module
     */
    canDelete: (module: string) => context.hasPermission(module, "delete"),
    
    /**
     * Check if user can view in a module
     */
    canView: (module: string) => context.hasPermission(module, "show"),
    
    /**
     * Check if user can export PDF in a module
     */
    canExportPDF: (module: string) => context.hasPermission(module, "pdf"),
    
    /**
     * Check if user can view trash in a module
     */
    canViewTrash: (module: string) => context.hasPermission(module, "trash_show"),
    
    /**
     * Check if user can restore in a module
     */
    canRestore: (module: string) => context.hasPermission(module, "restore"),
    
    /**
     * Check if user can permanently delete in a module
     */
    canPermanentlyDelete: (module: string) => context.hasPermission(module, "permanently_delete"),
  }
}
