"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { UserPermissions } from "@/lib/permissions"

interface PermissionContextType {
  permissions: UserPermissions
  loading: boolean
  hasPermission: (module: string, permission: string) => boolean
  canAccess: (module: string) => boolean
  refresh: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>({})
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/user/permissions")
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || {})
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const hasPermission = (module: string, permission: string): boolean => {
    return permissions[module]?.[permission] === true
  }

  const canAccess = (module: string): boolean => {
    return hasPermission(module, "module_show")
  }

  const refresh = async () => {
    setLoading(true)
    await fetchPermissions()
  }

  return (
    <PermissionContext.Provider 
      value={{ permissions, loading, hasPermission, canAccess, refresh }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }
  return context
}
