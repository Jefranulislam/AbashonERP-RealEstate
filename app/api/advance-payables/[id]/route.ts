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
      UPDATE advance_payables SET
        project_id = ${data.projectId || null},
        vendor_id = ${data.vendorId || null},
        constructor_id = ${data.constructorId || null},
        amount = ${data.amount || 0},
        payment_date = ${data.paymentDate || null},
        is_active = ${data.isActive}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ advancePayable: res[0] })
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
    await sql`DELETE FROM advance_payables WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
