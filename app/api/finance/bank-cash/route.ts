import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bankCashAccounts = await sql`
      SELECT * FROM bank_cash_accounts
      WHERE is_active = true
      ORDER BY account_title ASC
    `

    return NextResponse.json({ bankCashAccounts })
  } catch (error) {
    console.error("[v0] Error fetching bank/cash accounts:", error)
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

    const result = await sql`
      INSERT INTO bank_cash_accounts (account_title, description, is_active)
      VALUES (${data.accountTitle}, ${data.description}, ${data.isActive})
      RETURNING *
    `

    return NextResponse.json({ success: true, account: result[0] })
  } catch (error) {
    console.error("[v0] Error creating bank/cash account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
