import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT ibc.*, b.account_title FROM initial_bank_cash ibc LEFT JOIN bank_cash_accounts b ON ibc.bank_cash_id = b.id ORDER BY ibc.created_at DESC`
    return NextResponse.json({ initialBankCash: res })
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
    const res = await sql`INSERT INTO initial_bank_cash (bank_cash_id, initial_balance, date, is_confirmed) VALUES (${data.bankCashId || null}, ${data.initialBalance || 0}, ${data.date || null}, ${data.isConfirmed !== false}) RETURNING *`
    return NextResponse.json({ initialBankCash: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
