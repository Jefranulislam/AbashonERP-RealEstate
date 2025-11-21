import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, isActive } = await request.json()

    const result = await sql`
      UPDATE project_locations
      SET name = ${name}, is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, location: result[0] })
  } catch (error) {
    console.error("[v0] Error updating project location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if location is used by any projects
    const projectsUsingLocation = await sql`
      SELECT COUNT(*) as count FROM projects
      WHERE project_location_id = ${id}
    `

    if (projectsUsingLocation[0].count > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. It is being used by ${projectsUsingLocation[0].count} project(s).` },
        { status: 400 }
      )
    }

    // Hard delete - actually remove from database
    await sql`
      DELETE FROM project_locations
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting project location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
