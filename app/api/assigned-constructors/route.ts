import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT ac.*, p.project_name, c.constructor_name
      FROM assigned_constructors ac
      LEFT JOIN projects p ON ac.project_id = p.id
      LEFT JOIN constructors c ON ac.constructor_id = c.id
      WHERE ac.is_active = true
      ORDER BY ac.created_at DESC`
    return NextResponse.json({ assignments: res })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    const res = await sql`
      INSERT INTO assigned_constructors (project_id, constructor_id, is_active)
      VALUES (${data.projectId || null}, ${data.constructorId || null}, ${data.isActive !== false})
      RETURNING *
    `

    return NextResponse.json({ assignment: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
