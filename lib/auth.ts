import { cookies } from "next/headers"
import { sql } from "./db"

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface UserWithPermissions extends User {
  permissions: {
    [key: string]: boolean
  }
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    // Parse session data (in production, verify JWT token)
    const sessionData = JSON.parse(sessionCookie.value)

    // Fetch user from database
    const users = await sql`
      SELECT id, email, name, created_at
      FROM neon_auth.users_sync
      WHERE id = ${sessionData.userId}
      AND deleted_at IS NULL
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

// Get user with permissions
export async function getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
  try {
    const users = await sql`
      SELECT 
        u.id, u.email, u.name, u.created_at,
        p.*
      FROM neon_auth.users_sync u
      LEFT JOIN user_permissions p ON u.id = p.user_id
      WHERE u.id = ${userId}
      AND u.deleted_at IS NULL
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0] as any

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      permissions: {
        canAccessProject: user.can_access_project || false,
        canAccessProjectLocation: user.can_access_project_location || false,
        canAccessProducts: user.can_access_products || false,
        canAccessVendor: user.can_access_vendor || false,
        canAccessConstructor: user.can_access_constructor || false,
        canAccessAdvancePayable: user.can_access_advance_payable || false,
        canAccessSales: user.can_access_sales || false,
        canAccessPurchaseRequisition: user.can_access_purchase_requisition || false,
        canAccessPurchaseConfirm: user.can_access_purchase_confirm || false,
        canAccessPurchaseOrder: user.can_access_purchase_order || false,
        canAccessCustomer: user.can_access_customer || false,
        canAccessEmployeeList: user.can_access_employee_list || false,
        canAccessIncomeExpenseType: user.can_access_income_expense_type || false,
        canAccessIncomeExpenseHead: user.can_access_income_expense_head || false,
        canAccessIncomeExpenseHeadBalance: user.can_access_income_expense_head_balance || false,
        canAccessCheckManager: user.can_access_check_manager || false,
        canAccessClientInformation: user.can_access_client_information || false,
        canAccessBankCash: user.can_access_bank_cash || false,
        canAccessInitialBankCash: user.can_access_initial_bank_cash || false,
        canAccessTransaction: user.can_access_transaction || false,
        canAccessPurchaseReport: user.can_access_purchase_report || false,
        canAccessSalesReport: user.can_access_sales_report || false,
        canAccessSettings: user.can_access_settings || false,
        canAccessUsers: user.can_access_users || false,
      },
    }
  } catch (error) {
    console.error("[v0] Error getting user with permissions:", error)
    return null
  }
}

// Check if user has permission for a module
export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const user = await getUserWithPermissions(userId)
    if (!user) return false

    return user.permissions[permission] || false
  } catch (error) {
    console.error("[v0] Error checking permission:", error)
    return false
  }
}
