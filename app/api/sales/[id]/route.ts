import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const result = await sql`
      UPDATE sales
      SET 
        customer_id = ${data.customerId},
        seller_id = ${data.sellerId},
        project_id = ${data.projectId},
        product_id = ${data.productId},
        sale_date = ${data.saleDate},
        amount = ${data.amount},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, sale: result[0] })
  } catch (error) {
    console.error("[v0] Error updating sale:", error)
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

    await sql`
      UPDATE sales
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting sale:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
