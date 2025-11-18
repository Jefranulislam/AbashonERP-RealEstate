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

    const bankCashAccounts = await sql`
      SELECT id, account_title, description, is_active, created_at
      FROM bank_cash_accounts
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

    // Basic validation
    if (!data || typeof data.accountTitle !== "string" || data.accountTitle.trim() === "") {
      return NextResponse.json({ error: "Invalid accountTitle" }, { status: 400 })
    }

    const accountNumber = data.accountNumber || null
    const bankName = data.bankName || null
    const branch = data.branch || null
    const description = data.description || null
    const isActive = data.isActive === undefined ? true : !!data.isActive

    // The DB schema only defines account_title and description for bank_cash_accounts.
    // Store accountTitle and description; keep is_active where available.
    const result = await sql`
      INSERT INTO bank_cash_accounts (account_title, description, is_active)
      VALUES (${data.accountTitle}, ${description}, ${isActive})
      RETURNING id, account_title, description, is_active, created_at
    `

    return NextResponse.json({ success: true, account: result[0] })
  } catch (error) {
    console.error("[v0] Error creating bank/cash account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
