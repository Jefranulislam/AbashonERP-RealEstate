import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT ch.*, cu.customer_name FROM cheques ch LEFT JOIN customers cu ON ch.customer_id = cu.id ORDER BY ch.created_at DESC`
    return NextResponse.json({ cheques: res })
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
    const res = await sql`
      INSERT INTO cheques (customer_id, bank_name, cheque_number, cheque_amount, cheque_date, submitted_date, is_submitted)
      VALUES (${data.customerId || null}, ${data.bankName || null}, ${data.chequeNumber}, ${data.chequeAmount || 0}, ${data.chequeDate || null}, ${data.submittedDate || null}, ${data.isSubmitted !== false})
      RETURNING *
    `
    return NextResponse.json({ cheque: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
