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
      SELECT 
        ap.*, 
        p.project_name, 
        v.vendor_name, 
        c.constructor_name
      FROM advance_payables ap
      LEFT JOIN projects p ON ap.project_id = p.id
      LEFT JOIN vendors v ON ap.vendor_id = v.id
      LEFT JOIN constructors c ON ap.constructor_id = c.id
      WHERE ap.id = ${id}
      LIMIT 1
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ advancePayable: res[0] })
  } catch (error) {
    console.error("[v0] Error fetching advance payable:", error)
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
      UPDATE advance_payables SET
        project_id = ${data.projectId},
        vendor_id = ${data.vendorId || null},
        constructor_id = ${data.constructorId || null},
        amount = ${data.amount},
        payment_date = ${data.paymentDate},
        payment_type = ${data.paymentType || 'Advance'},
        payment_method = ${data.paymentMethod || null},
        reference_number = ${data.referenceNumber || null},
        description = ${data.description || null},
        status = ${data.status || 'Pending'},
        is_active = ${data.isActive !== false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      advancePayable: res[0] 
    })
  } catch (error) {
    console.error("[v0] Error updating advance payable:", error)
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
    
    // Soft delete by setting is_active to false
    await sql`
      UPDATE advance_payables 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
