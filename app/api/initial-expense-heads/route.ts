import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT ieh.*, p.project_name, ie.head_name FROM initial_expense_heads ieh LEFT JOIN projects p ON ieh.project_id = p.id LEFT JOIN income_expense_heads ie ON ieh.expense_head_id = ie.id ORDER BY ieh.created_at DESC`
    return NextResponse.json({ initialExpenseHeads: res })
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
    const res = await sql`INSERT INTO initial_expense_heads (project_id, expense_head_id, initial_balance, date, is_confirmed) VALUES (${data.projectId || null}, ${data.expenseHeadId || null}, ${data.initialBalance || 0}, ${data.date || null}, ${data.isConfirmed !== false}) RETURNING *`
    return NextResponse.json({ initialExpenseHead: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
