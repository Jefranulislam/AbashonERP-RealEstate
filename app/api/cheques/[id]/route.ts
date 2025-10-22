import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number.parseInt(params.id)
    const data = await request.json()
    const res = await sql`
      UPDATE cheques SET
        customer_id = ${data.customerId || null},
        bank_name = ${data.bankName || null},
        cheque_number = ${data.chequeNumber},
        cheque_amount = ${data.chequeAmount || 0},
        cheque_date = ${data.chequeDate || null},
        submitted_date = ${data.submittedDate || null},
        is_submitted = ${data.isSubmitted}
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json({ cheque: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number.parseInt(params.id)
    await sql`DELETE FROM cheques WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
