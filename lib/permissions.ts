import { sql } from "./db"

export interface Permission {
  module_name: string
  permission_name: string
  is_granted: boolean
}

export interface UserPermissions {
  [moduleName: string]: {
    [permissionName: string]: boolean
  }
}

/**
 * Get all permissions for a user based on their role
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  try {
    // First get the user's role
    const userResult = await sql`
      SELECT role_id FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `

    if (userResult.length === 0 || !userResult[0].role_id) {
      return {}
    }

    const roleId = userResult[0].role_id

    // Get all permissions for this role
    const permissions = await sql`
      SELECT 
        m.module_name,
        p.permission_name,
        rp.is_granted
      FROM role_permissions rp
      JOIN modules m ON m.id = rp.module_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ${roleId}
        AND rp.is_granted = true
        AND m.is_active = true
    `

    // Group permissions by module
    const userPermissions: UserPermissions = {}
    
    for (const perm of permissions) {
      if (!userPermissions[perm.module_name]) {
        userPermissions[perm.module_name] = {}
      }
      userPermissions[perm.module_name][perm.permission_name] = perm.is_granted
    }

    return userPermissions
  } catch (error) {
    console.error("[Permissions] Error getting user permissions:", error)
    return {}
  }
}

/**
 * Check if a user has a specific permission for a module
 */
export async function hasPermission(
  userId: string,
  moduleName: string,
  permissionName: string
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT rp.is_granted
      FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN modules m ON m.id = rp.module_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ${userId}
        AND u.deleted_at IS NULL
        AND m.module_name = ${moduleName}
        AND m.is_active = true
        AND p.permission_name = ${permissionName}
        AND rp.is_granted = true
    `

    return result.length > 0 && result[0].is_granted
  } catch (error) {
    console.error("[Permissions] Error checking permission:", error)
    return false
  }
}

/**
 * Check if a user can access a module (has module_show permission)
 */
export async function canAccessModule(
  userId: string,
  moduleName: string
): Promise<boolean> {
  return hasPermission(userId, moduleName, 'module_show')
}

/**
 * Get user's role information
 */
export async function getUserRole(userId: string) {
  try {
    const result = await sql`
      SELECT 
        r.id,
        r.role_name,
        r.description
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ${userId}
        AND u.deleted_at IS NULL
        AND r.deleted_at IS NULL
    `

    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("[Permissions] Error getting user role:", error)
    return null
  }
}

/**
 * Check multiple permissions at once
 */
export async function hasAnyPermission(
  userId: string,
  checks: Array<{ module: string; permission: string }>
): Promise<boolean> {
  try {
    for (const check of checks) {
      const hasIt = await hasPermission(userId, check.module, check.permission)
      if (hasIt) return true
    }
    return false
  } catch (error) {
    console.error("[Permissions] Error checking multiple permissions:", error)
    return false
  }
}

/**
 * Check if user has all specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  checks: Array<{ module: string; permission: string }>
): Promise<boolean> {
  try {
    for (const check of checks) {
      const hasIt = await hasPermission(userId, check.module, check.permission)
      if (!hasIt) return false
    }
    return true
  } catch (error) {
    console.error("[Permissions] Error checking all permissions:", error)
    return false
  }
}

/**
 * Get all modules accessible by a user
 */
export async function getAccessibleModules(userId: string): Promise<string[]> {
  try {
    const result = await sql`
      SELECT DISTINCT m.module_name
      FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN modules m ON m.id = rp.module_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ${userId}
        AND u.deleted_at IS NULL
        AND m.is_active = true
        AND p.permission_name = 'module_show'
        AND rp.is_granted = true
      ORDER BY m.module_name
    `

    return result.map((r: any) => r.module_name)
  } catch (error) {
    console.error("[Permissions] Error getting accessible modules:", error)
    return []
  }
}
