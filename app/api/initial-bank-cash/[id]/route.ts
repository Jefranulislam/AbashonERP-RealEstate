import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const data = await request.json()
    
    const res = await sql`
      UPDATE initial_bank_cash 
      SET bank_cash_id = ${data.bankCashId || null}, 
          initial_balance = ${data.initialBalance || 0},
          date = ${data.date || null},
          is_confirmed = ${data.isConfirmed !== false},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Initial balance not found" }, { status: 404 })
    }
    
    return NextResponse.json({ initialBankCash: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const res = await sql`
      DELETE FROM initial_bank_cash 
      WHERE id = ${id}
      RETURNING id
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Initial balance not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Initial balance deleted successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
