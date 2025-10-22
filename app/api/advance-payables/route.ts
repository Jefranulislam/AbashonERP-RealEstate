import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const res = await sql`SELECT ap.*, p.project_name, v.vendor_name, c.constructor_name
      FROM advance_payables ap
      LEFT JOIN projects p ON ap.project_id = p.id
      LEFT JOIN vendors v ON ap.vendor_id = v.id
      LEFT JOIN constructors c ON ap.constructor_id = c.id
      WHERE ap.is_active = true
      ORDER BY ap.created_at DESC`

    return NextResponse.json({ advancePayables: res })
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
      INSERT INTO advance_payables (project_id, vendor_id, constructor_id, amount, payment_date, is_active)
      VALUES (
        ${data.projectId || null},
        ${data.vendorId || null},
        ${data.constructorId || null},
        ${data.amount || 0},
        ${data.paymentDate || null},
        ${data.isActive !== false}
      ) RETURNING *
    `

    return NextResponse.json({ advancePayable: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
