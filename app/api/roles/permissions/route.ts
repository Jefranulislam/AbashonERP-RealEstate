import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET permissions for a specific role
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
    }

    // Get all modules with their permissions for this role
    const permissions = await sql`
      SELECT 
        m.id as module_id,
        m.module_name,
        m.display_name,
        p.id as permission_id,
        p.permission_name,
        p.description as permission_description,
        COALESCE(rp.is_granted, false) as is_granted,
        rp.id as role_permission_id
      FROM modules m
      CROSS JOIN permissions p
      LEFT JOIN role_permissions rp 
        ON rp.module_id = m.id 
        AND rp.permission_id = p.id 
        AND rp.role_id = ${roleId}
      WHERE m.is_active = true
      ORDER BY m.sort_order, m.display_name, p.id
    `

    // Group by module
    const groupedPermissions = permissions.reduce((acc: any, row: any) => {
      const moduleKey = row.module_name
      
      if (!acc[moduleKey]) {
        acc[moduleKey] = {
          module_id: row.module_id,
          module_name: row.module_name,
          display_name: row.display_name,
          permissions: {}
        }
      }
      
      acc[moduleKey].permissions[row.permission_name] = {
        permission_id: row.permission_id,
        permission_name: row.permission_name,
        description: row.permission_description,
        is_granted: row.is_granted,
        role_permission_id: row.role_permission_id
      }
      
      return acc
    }, {})

    return NextResponse.json({ permissions: Object.values(groupedPermissions) })
  } catch (error) {
    console.error("[API] Error fetching role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST/PUT update permissions for a role
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { roleId, moduleId, permissionId, isGranted } = data

    if (!roleId || !moduleId || !permissionId) {
      return NextResponse.json({ 
        error: "Role ID, Module ID, and Permission ID are required" 
      }, { status: 400 })
    }

    // Upsert permission
    const result = await sql`
      INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
      VALUES (${roleId}, ${moduleId}, ${permissionId}, ${isGranted})
      ON CONFLICT (role_id, module_id, permission_id) 
      DO UPDATE SET 
        is_granted = ${isGranted},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    // Log the change
    await sql`
      INSERT INTO role_permission_audit_log 
        (role_id, module_id, permission_id, action, changed_by, new_value)
      VALUES 
        (${roleId}, ${moduleId}, ${permissionId}, 'MODIFIED', ${user.email}, ${isGranted})
    `

    return NextResponse.json({ success: true, permission: result[0] })
  } catch (error) {
    console.error("[API] Error updating role permission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT bulk update permissions for a role
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { roleId, permissions } = data

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ 
        error: "Role ID and permissions array are required" 
      }, { status: 400 })
    }

    // Delete all existing permissions for this role
    await sql`
      DELETE FROM role_permissions
      WHERE role_id = ${roleId}
    `

    // Insert new permissions
    if (permissions.length > 0) {
      const values = permissions.map((p: any) => 
        `(${roleId}, ${p.moduleId}, ${p.permissionId}, ${p.isGranted})`
      ).join(',')

      await sql.unsafe(`
        INSERT INTO role_permissions (role_id, module_id, permission_id, is_granted)
        VALUES ${values}
      `)

      // Log the bulk change
      await sql`
        INSERT INTO role_permission_audit_log 
          (role_id, action, changed_by, notes)
        VALUES 
          (${roleId}, 'BULK_UPDATE', ${user.email}, 
           ${`Updated ${permissions.length} permissions`})
      `
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${permissions.length} permissions` 
    })
  } catch (error) {
    console.error("[API] Error bulk updating role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
