import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    const res = await sql`
      SELECT ch.*, cu.customer_name 
      FROM cheques ch 
      LEFT JOIN customers cu ON ch.customer_id = cu.id 
      WHERE ch.id = ${id}
      LIMIT 1
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Cheque not found" }, { status: 404 })
    }

    return NextResponse.json({ cheque: res[0] })
  } catch (error) {
    console.error("[v0] Error fetching cheque:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    const data = await request.json()

    const res = await sql`
      UPDATE cheques SET
        customer_id = ${data.customerId || null},
        bank_name = ${data.bankName || null},
        branch_name = ${data.branchName || null},
        cheque_number = ${data.chequeNumber},
        cheque_amount = ${data.chequeAmount},
        cheque_date = ${data.chequeDate},
        received_date = ${data.receivedDate || null},
        submitted_date = ${data.submittedDate || null},
        is_submitted = ${data.isSubmitted || false},
        status = ${data.status || 'Pending'},
        remarks = ${data.remarks || null},
        cleared_date = ${data.clearedDate || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Cheque not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      cheque: res[0] 
    })
  } catch (error) {
    console.error("[v0] Error updating cheque:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    await sql`DELETE FROM cheques WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting cheque:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
