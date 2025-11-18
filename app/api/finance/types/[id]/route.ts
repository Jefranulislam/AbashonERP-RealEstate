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
    if (!data || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    const isActive = data.isActive === undefined ? true : !!data.isActive
    
    const res = await sql`
      UPDATE income_expense_types 
      SET name = ${data.name}, 
          is_active = ${isActive},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, is_active, created_at, updated_at
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Type not found" }, { status: 404 })
    }
    
    return NextResponse.json({ type: res[0] })
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
      DELETE FROM income_expense_types 
      WHERE id = ${id}
      RETURNING id
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Type not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Type deleted successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
