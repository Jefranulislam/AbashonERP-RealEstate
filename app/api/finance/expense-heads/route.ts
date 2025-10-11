import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

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
