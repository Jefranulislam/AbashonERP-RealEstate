import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    let users
    if (search) {
      users = await sql`
        SELECT 
          u.id, 
          u.email, 
          u.name, 
          u.created_at,
          u.updated_at,
          COALESCE(up.category, 'User') as role,
          COALESCE(up.is_active, true) as is_active,
          up.id as permission_id
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.deleted_at IS NULL
        AND (u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})
        ORDER BY u.created_at DESC
      `
    } else {
      users = await sql`
        SELECT 
          u.id, 
          u.email, 
          u.name, 
          u.created_at,
          u.updated_at,
          COALESCE(up.category, 'User') as role,
          COALESCE(up.is_active, true) as is_active,
          up.id as permission_id
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE u.deleted_at IS NULL
        ORDER BY u.created_at DESC
      `
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, phone } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name, created_at
    `

    // Create user permissions based on role
    const isAdmin = role === "Admin"
    const isManager = role === "Manager"
    
    await sql`
      INSERT INTO user_permissions (
        user_id,
        phone,
        category,
        can_access_project,
        can_access_project_location,
        can_access_products,
        can_access_vendor,
        can_access_constructor,
        can_access_advance_payable,
        can_access_sales,
        can_access_purchase_requisition,
        can_access_purchase_confirm,
        can_access_purchase_order,
        can_access_customer,
        can_access_employee_list,
        can_access_income_expense_type,
        can_access_income_expense_head,
        can_access_income_expense_head_balance,
        can_access_check_manager,
        can_access_client_information,
        can_access_bank_cash,
        can_access_initial_bank_cash,
        can_access_transaction,
        can_access_purchase_report,
        can_access_sales_report,
        can_access_settings,
        can_access_users,
        is_active
      )
      VALUES (
        ${newUser[0].id},
        ${phone || null},
        ${role || 'User'},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin || isManager},
        ${isAdmin},
        ${isAdmin},
        true
      )
    `

    return NextResponse.json({
      success: true,
      user: newUser[0],
    })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
