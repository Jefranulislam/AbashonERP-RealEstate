import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id: idString } = await params
    const id = Number.parseInt(idString)

    const result = await sql`
      UPDATE constructors SET
        constructor_name = ${data.constructorName},
        mailing_address = ${data.mailingAddress || null},
        phone = ${data.phone || null},
        email = ${data.email || null},
        description = ${data.description || null},
        is_active = ${data.isActive}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, constructor: result[0] })
  } catch (error) {
    console.error("[v0] Error updating constructor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    console.log("[DELETE constructor] Attempting to delete constructor with ID:", id)

    // Check for foreign key constraints
    const assignedCheck = await sql`SELECT COUNT(*) as count FROM assigned_constructors WHERE constructor_id = ${id}`
    const advanceCheck = await sql`SELECT COUNT(*) as count FROM advance_payables WHERE constructor_id = ${id}`
    
    const assignedCount = Number(assignedCheck[0]?.count || 0)
    const advanceCount = Number(advanceCheck[0]?.count || 0)
    
    console.log("[DELETE constructor] Constraint check - assigned:", assignedCount, "advance:", advanceCount)
    
    if (assignedCount > 0 || advanceCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete constructor. It has related records.",
        details: {
          assignedConstructors: assignedCount,
          advancePayables: advanceCount
        }
      }, { status: 400 })
    }

    await sql`DELETE FROM constructors WHERE id = ${id}`
    console.log("[DELETE constructor] Successfully deleted constructor with ID:", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE constructor] Error deleting constructor:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
