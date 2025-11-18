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
    if (!data || typeof data.accountTitle !== 'string' || data.accountTitle.trim() === '') {
      return NextResponse.json({ error: 'Invalid accountTitle' }, { status: 400 })
    }

    const description = data.description || null
    const isActive = data.isActive === undefined ? true : !!data.isActive
    
    const res = await sql`
      UPDATE bank_cash_accounts 
      SET account_title = ${data.accountTitle}, 
          description = ${description},
          is_active = ${isActive},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, account_title, description, is_active, created_at, updated_at
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Bank/cash account not found" }, { status: 404 })
    }
    
    return NextResponse.json({ account: res[0] })
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
      DELETE FROM bank_cash_accounts 
      WHERE id = ${id}
      RETURNING id
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Bank/cash account not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Bank/cash account deleted successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
