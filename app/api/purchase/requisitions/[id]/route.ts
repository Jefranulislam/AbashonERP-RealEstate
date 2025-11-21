import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const requisitions = await sql`
      SELECT 
        pr.*,
        p.project_name,
        e.name as employee_name
      FROM purchase_requisitions pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN employees e ON pr.employee_id = e.id
      WHERE pr.id = ${id}
      LIMIT 1
    `

    if (requisitions.length === 0) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    const items = await sql`
      SELECT 
        pri.*,
        ieh.head_name as expense_head_name
      FROM purchase_requisition_items pri
      LEFT JOIN income_expense_heads ieh ON pri.expense_head_id = ieh.id
      WHERE pri.requisition_id = ${id}
    `

    return NextResponse.json({ requisition: requisitions[0], items })
  } catch (error) {
    console.error("[v0] Error fetching requisition:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`DELETE FROM purchase_requisition_items WHERE requisition_id = ${id}`
    await sql`DELETE FROM purchase_requisitions WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting requisition:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const result = await sql`
      UPDATE purchase_requisitions
      SET 
        is_confirmed = ${data.is_confirmed},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, requisition: result[0] })
  } catch (error) {
    console.error("[v0] Error updating requisition:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
