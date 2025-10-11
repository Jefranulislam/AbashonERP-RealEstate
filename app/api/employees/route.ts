import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching employees")
    const employees = await sql`
      SELECT * FROM employees
      WHERE is_active = true
      ORDER BY name ASC
    `

    console.log("[v0] Employees fetched:", employees.length)
    return NextResponse.json({ employees })
  } catch (error) {
    console.error("[v0] Error fetching employees:", error)
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
    console.log("[v0] Creating employee with data:", data)

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

    console.log("[v0] Employee created:", result[0])
    return NextResponse.json({ success: true, employee: result[0] })
  } catch (error) {
    console.error("[v0] Error creating employee:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
