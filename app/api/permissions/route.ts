import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET all permissions
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const permissions = await sql`
      SELECT 
        id,
        permission_name,
        description,
        created_at
      FROM permissions
      ORDER BY id ASC
    `

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("[API] Error fetching permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
