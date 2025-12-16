import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// ✅ Use Edge runtime for faster cold starts
export const runtime = 'edge'
// ✅ Cache GET requests for 60 seconds
export const revalidate = 60

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all expense heads with hierarchy information
    const expenseHeads = await sql`
      SELECT 
        ieh.*,
        iet.name as type_name,
        parent.head_name as parent_name,
        COALESCE(ieh.full_path, ieh.head_name) as full_path,
        COALESCE(ieh.level, 0) as level
      FROM income_expense_heads ieh
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      LEFT JOIN income_expense_heads parent ON ieh.parent_id = parent.id
      WHERE ieh.is_active = true
      ORDER BY 
        COALESCE(ieh.full_path, ieh.head_name) ASC,
        ieh.head_name ASC
    `

    // Also get hierarchical view for easier display
    const hierarchicalView = await sql`
      SELECT * FROM v_expense_heads_hierarchy
      ORDER BY sort_path
    `

    return NextResponse.json({ 
      expenseHeads,
      hierarchicalView 
    })
  } catch (error) {
    console.error("[v0] Error fetching expense heads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    if (!data || typeof data.headName !== 'string' || data.headName.trim() === '') {
      return NextResponse.json({ error: 'Invalid headName' }, { status: 400 })
    }

    const incExpTypeId = data.incExpTypeId || null
    const parentId = data.parentId || null
    const isGroup = data.isGroup === true
    const type = data.type || 'Dr'
    const unit = data.unit || null
    const isActive = data.isActive === undefined ? true : !!data.isActive

    const res = await sql`
      INSERT INTO income_expense_heads (
        head_name, 
        inc_exp_type_id, 
        parent_id,
        is_group,
        type,
        unit,
        is_active
      )
      VALUES (
        ${data.headName}, 
        ${incExpTypeId}, 
        ${parentId},
        ${isGroup},
        ${type},
        ${unit},
        ${isActive}
      )
      RETURNING id, head_name, inc_exp_type_id, parent_id, is_group, level, full_path, type, unit, is_active, created_at
    `

    return NextResponse.json({ head: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
