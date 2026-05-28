import { sql } from "@/lib/db"

/**
 * Resolve whether a user is an Admin based on either RBAC role or legacy user_permissions category.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const roleMatch = await sql`
      SELECT 1
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id AND r.deleted_at IS NULL
      LEFT JOIN user_permissions up ON up.user_id = u.id
      WHERE u.id = ${userId}
        AND u.deleted_at IS NULL
        AND (
          LOWER(COALESCE(r.role_name, '')) = 'admin'
          OR LOWER(COALESCE(up.category, '')) = 'admin'
        )
      LIMIT 1
    `

    return roleMatch.length > 0
  } catch (error) {
    console.error("[Admin Access] Error checking admin role:", error)
    return false
  }
}
