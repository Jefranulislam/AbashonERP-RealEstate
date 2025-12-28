import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET all roles
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roles = await sql`
      SELECT 
        r.id,
        r.role_name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT e.id) as employee_count,
        COUNT(DISTINCT u.id) as user_count
      FROM roles r
      LEFT JOIN employees e ON e.role_id = r.id AND e.is_active = true
      LEFT JOIN users u ON u.role_id = r.id AND u.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, r.role_name, r.description, r.is_active, r.created_at, r.updated_at
      ORDER BY r.role_name ASC
    `

    return NextResponse.json({ roles })
  } catch (error: any) {
    console.error("[API] Error fetching roles:", error)
    
    // Check if the error is due to missing tables
    if (error.message?.includes('relation "roles" does not exist')) {
      return NextResponse.json({ 
        error: "RBAC tables not initialized",
        message: "Please run the RBAC migration: npm run migrate:rbac",
        hint: "The roles table does not exist. Run the migration script to create RBAC tables."
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST create new role
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { role_name, description, is_active = true } = data

    if (!role_name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO roles (role_name, description, is_active)
      VALUES (${role_name}, ${description || null}, ${is_active})
      RETURNING *
    `

    return NextResponse.json({ success: true, role: result[0] })
  } catch (error: any) {
    console.error("[API] Error creating role:", error)
    
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update role
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id, role_name, description, is_active } = data

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE roles
      SET 
        role_name = ${role_name},
        description = ${description || null},
        is_active = ${is_active},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, role: result[0] })
  } catch (error: any) {
    console.error("[API] Error updating role:", error)
    
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE soft delete role
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
    }

    // Check if role is in use
    const usageCheck = await sql`
      SELECT 
        (SELECT COUNT(*) FROM employees WHERE role_id = ${id} AND is_active = true) as employee_count,
        (SELECT COUNT(*) FROM users WHERE role_id = ${id} AND deleted_at IS NULL) as user_count
    `

    const { employee_count, user_count } = usageCheck[0]
    
    if (Number(employee_count) > 0 || Number(user_count) > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. It is assigned to ${employee_count} employee(s) and ${user_count} user(s)` 
      }, { status: 400 })
    }

    const result = await sql`
      UPDATE roles
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Role deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
