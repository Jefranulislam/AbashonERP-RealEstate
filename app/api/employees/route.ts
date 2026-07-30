import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching employees")
    
    // Try with role join first, fallback to simple query if roles table doesn't exist
    try {
      const employees = await sql`
        SELECT 
          e.*,
          r.role_name
        FROM employees e
        LEFT JOIN roles r ON r.id = e.role_id AND r.deleted_at IS NULL
        WHERE e.is_active = true
        ORDER BY e.name ASC
      `
      console.log("Employees fetched:", employees.length)
      return NextResponse.json({ employees })
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist')) {
        // Fallback: fetch without roles if RBAC tables don't exist
        const employees = await sql`
          SELECT * FROM employees
          WHERE is_active = true
          ORDER BY name ASC
        `
        console.log("Employees fetched (no RBAC):", employees.length)
        return NextResponse.json({ employees })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("Creating employee with data:", data)

    // Check if role_id column exists, if not, insert without it
    try {
      const result = await sql`
        INSERT INTO employees (
          name, phone, email, position, department, address, role_id, is_active
        ) VALUES (
          ${data.name}, 
          ${data.phone || null}, 
          ${data.email || null}, 
          ${data.position || null}, 
          ${data.department || null}, 
          ${data.address || null}, 
          ${data.role_id || null},
          ${data.isActive !== false}
        )
        RETURNING *
      `
      console.log("Employee created:", result[0])
      return NextResponse.json({ success: true, employee: result[0] })
    } catch (dbError: any) {
      if (dbError.message?.includes('role_id') && dbError.message?.includes('does not exist')) {
        // Fallback: insert without role_id if column doesn't exist
        const result = await sql`
          INSERT INTO employees (
            name, phone, email, position, department, address, is_active
          ) VALUES (
            ${data.name}, 
            ${data.phone || null}, 
            ${data.email || null}, 
            ${data.position || null}, 
            ${data.department || null}, 
            ${data.address || null}, 
            ${data.isActive !== false}
          )
          RETURNING *
        `
        console.log("Employee created (no role):", result[0])
        return NextResponse.json({ success: true, employee: result[0] })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
