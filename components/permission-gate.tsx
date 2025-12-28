"use client"

import { usePermissions } from "@/lib/providers/permission-provider"
import type { ReactNode } from "react"

interface PermissionGateProps {
  module: string
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders children if user has the specified permission
 */
export function PermissionGate({ 
  module, 
  permission, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!hasPermission(module, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface ModuleGateProps {
  module: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that only renders children if user can access the module
 */
export function ModuleGate({ 
  module, 
  children, 
  fallback = null 
}: ModuleGateProps) {
  const { canAccess, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!canAccess(module)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
