import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'
export const revalidate = 60

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const locations = await sql`
      SELECT * FROM project_locations
      ORDER BY name ASC
    `

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("[v0] Error fetching project locations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, isActive } = await request.json()

    const result = await sql`
      INSERT INTO project_locations (name, is_active)
      VALUES (${name}, ${isActive})
      RETURNING *
    `

    return NextResponse.json({ success: true, location: result[0] })
  } catch (error) {
    console.error("[v0] Error creating project location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
