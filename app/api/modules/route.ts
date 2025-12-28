import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET all modules
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const modules = await sql`
      SELECT 
        id,
        module_name,
        display_name,
        description,
        parent_module_id,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM modules
      WHERE is_active = true
      ORDER BY sort_order ASC, display_name ASC
    `

    return NextResponse.json({ modules })
  } catch (error) {
    console.error("[API] Error fetching modules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new module
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { module_name, display_name, description, parent_module_id, sort_order } = data

    if (!module_name || !display_name) {
      return NextResponse.json({ 
        error: "Module name and display name are required" 
      }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO modules (
        module_name, 
        display_name, 
        description, 
        parent_module_id, 
        sort_order
      )
      VALUES (
        ${module_name}, 
        ${display_name}, 
        ${description || null}, 
        ${parent_module_id || null}, 
        ${sort_order || 0}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, module: result[0] })
  } catch (error: any) {
    console.error("[API] Error creating module:", error)
    
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json({ error: "Module name already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
