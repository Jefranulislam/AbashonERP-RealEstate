import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    const users = await sql`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.created_at,
        u.updated_at,
        up.*
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      WHERE u.id = ${userId} AND u.deleted_at IS NULL
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const body = await request.json()
    const { name, email, password, role, phone, is_active, permissions } = body

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user basic info
    let updatedUser
    if (password && password.trim() !== "") {
      // Update with new password
      const passwordHash = await bcrypt.hash(password, 10)
      updatedUser = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email},
          password_hash = ${passwordHash},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, email, name, created_at, updated_at
      `
    } else {
      // Update without changing password
      updatedUser = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, email, name, created_at, updated_at
      `
    }

    // Update permissions
    if (permissions) {
      // Check if permissions record exists
      const existingPerms = await sql`
        SELECT id FROM user_permissions WHERE user_id = ${userId}
      `

      if (existingPerms.length > 0) {
        // Update existing permissions
        await sql`
          UPDATE user_permissions
          SET
            phone = ${phone || null},
            category = ${role || 'User'},
            is_active = ${is_active !== undefined ? is_active : true},
            can_access_project = ${permissions.can_access_project || false},
            can_access_project_location = ${permissions.can_access_project_location || false},
            can_access_products = ${permissions.can_access_products || false},
            can_access_vendor = ${permissions.can_access_vendor || false},
            can_access_constructor = ${permissions.can_access_constructor || false},
            can_access_advance_payable = ${permissions.can_access_advance_payable || false},
            can_access_sales = ${permissions.can_access_sales || false},
            can_access_purchase_requisition = ${permissions.can_access_purchase_requisition || false},
            can_access_purchase_confirm = ${permissions.can_access_purchase_confirm || false},
            can_access_purchase_order = ${permissions.can_access_purchase_order || false},
            can_access_customer = ${permissions.can_access_customer || false},
            can_access_employee_list = ${permissions.can_access_employee_list || false},
            can_access_income_expense_type = ${permissions.can_access_income_expense_type || false},
            can_access_income_expense_head = ${permissions.can_access_income_expense_head || false},
            can_access_income_expense_head_balance = ${permissions.can_access_income_expense_head_balance || false},
            can_access_check_manager = ${permissions.can_access_check_manager || false},
            can_access_client_information = ${permissions.can_access_client_information || false},
            can_access_bank_cash = ${permissions.can_access_bank_cash || false},
            can_access_initial_bank_cash = ${permissions.can_access_initial_bank_cash || false},
            can_access_transaction = ${permissions.can_access_transaction || false},
            can_access_purchase_report = ${permissions.can_access_purchase_report || false},
            can_access_sales_report = ${permissions.can_access_sales_report || false},
            can_access_settings = ${permissions.can_access_settings || false},
            can_access_users = ${permissions.can_access_users || false},
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `
      } else {
        // Create new permissions
        await sql`
          INSERT INTO user_permissions (
            user_id, phone, category, is_active,
            can_access_project, can_access_project_location, can_access_products,
            can_access_vendor, can_access_constructor, can_access_advance_payable,
            can_access_sales, can_access_purchase_requisition, can_access_purchase_confirm,
            can_access_purchase_order, can_access_customer, can_access_employee_list,
            can_access_income_expense_type, can_access_income_expense_head,
            can_access_income_expense_head_balance, can_access_check_manager,
            can_access_client_information, can_access_bank_cash, can_access_initial_bank_cash,
            can_access_transaction, can_access_purchase_report, can_access_sales_report,
            can_access_settings, can_access_users
          )
          VALUES (
            ${userId}, ${phone || null}, ${role || 'User'}, ${is_active !== undefined ? is_active : true},
            ${permissions.can_access_project || false}, ${permissions.can_access_project_location || false},
            ${permissions.can_access_products || false}, ${permissions.can_access_vendor || false},
            ${permissions.can_access_constructor || false}, ${permissions.can_access_advance_payable || false},
            ${permissions.can_access_sales || false}, ${permissions.can_access_purchase_requisition || false},
            ${permissions.can_access_purchase_confirm || false}, ${permissions.can_access_purchase_order || false},
            ${permissions.can_access_customer || false}, ${permissions.can_access_employee_list || false},
            ${permissions.can_access_income_expense_type || false}, ${permissions.can_access_income_expense_head || false},
            ${permissions.can_access_income_expense_head_balance || false}, ${permissions.can_access_check_manager || false},
            ${permissions.can_access_client_information || false}, ${permissions.can_access_bank_cash || false},
            ${permissions.can_access_initial_bank_cash || false}, ${permissions.can_access_transaction || false},
            ${permissions.can_access_purchase_report || false}, ${permissions.can_access_sales_report || false},
            ${permissions.can_access_settings || false}, ${permissions.can_access_users || false}
          )
        `
      }
    } else {
      // Simple role-based update
      const isAdmin = role === "Admin"
      const isManager = role === "Manager"

      const existingPerms = await sql`
        SELECT id FROM user_permissions WHERE user_id = ${userId}
      `

      if (existingPerms.length > 0) {
        await sql`
          UPDATE user_permissions
          SET
            phone = ${phone || null},
            category = ${role || 'User'},
            is_active = ${is_active !== undefined ? is_active : true},
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Soft delete the user
    await sql`
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
