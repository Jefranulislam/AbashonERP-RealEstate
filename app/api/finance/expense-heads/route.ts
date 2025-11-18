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

    const expenseHeads = await sql`
      SELECT 
        ieh.*,
        iet.name as type_name
      FROM income_expense_heads ieh
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      WHERE ieh.is_active = true
      ORDER BY ieh.head_name ASC
    `

    return NextResponse.json({ expenseHeads })
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
  // The `income_expense_heads` table does not include a `description` column
  // according to the schema. Accept the value from the client but do not store
  // it to avoid SQL errors. If you want to persist descriptions, add a column
  // via a migration and then store it here.
  const description = data.description || null
    const isActive = data.isActive === undefined ? true : !!data.isActive

    const res = await sql`
      INSERT INTO income_expense_heads (head_name, inc_exp_type_id, is_active)
      VALUES (${data.headName}, ${incExpTypeId}, ${isActive})
      RETURNING id, head_name, inc_exp_type_id, is_active, created_at
    `

    return NextResponse.json({ head: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
