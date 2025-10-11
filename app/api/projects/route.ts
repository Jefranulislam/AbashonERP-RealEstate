import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching projects")
    const projects = await sql`
      SELECT 
        p.*,
        pl.name as location_name
      FROM projects p
      LEFT JOIN project_locations pl ON p.project_location_id = pl.id
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `

    console.log("[v0] Projects fetched:", projects.length)
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("[v0] Error fetching projects:", error)
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
    console.log("[v0] Creating project with data:", data)

    const result = await sql`
      INSERT INTO projects (
        project_name, project_location_id, address, facing, building_height,
        land_area, project_launching_date, hand_over_date, description, is_active
      ) VALUES (
        ${data.projectName}, 
        ${data.projectLocationId ? Number.parseInt(data.projectLocationId) : null}, 
        ${data.address || null}, 
        ${data.facing || null}, 
        ${data.buildingHeight || null}, 
        ${data.landArea || null},
        ${data.projectLaunchingDate || null}, 
        ${data.handOverDate || null}, 
        ${data.description || null}, 
        ${data.isActive !== false}
      )
      RETURNING *
    `

    console.log("[v0] Project created:", result[0])
    return NextResponse.json({ success: true, project: result[0] })
  } catch (error) {
    console.error("[v0] Error creating project:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
