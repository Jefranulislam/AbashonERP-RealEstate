import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

// GET: Get a single delivery with item rows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const rows = await sql`
      SELECT
        md.*,
        po.po_number,
        v.vendor_name,
        p.project_name,
        e1.name as received_by_name,
        e2.name as quality_checked_by_name,
        ieh.head_name as expense_head_name
      FROM material_deliveries md
      LEFT JOIN purchase_orders po ON md.po_id = po.id
      LEFT JOIN vendors v ON md.vendor_id = v.id
      LEFT JOIN projects p ON md.project_id = p.id
      LEFT JOIN employees e1 ON md.received_by = e1.id
      LEFT JOIN employees e2 ON md.quality_checked_by = e2.id
      LEFT JOIN purchase_order_items poi ON md.po_item_id = poi.id
      LEFT JOIN income_expense_heads ieh ON poi.expense_head_id = ieh.id
      WHERE md.id = ${id} AND md.is_active = true
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    const delivery = rows[0]

    return NextResponse.json({
      ...delivery,
      items: [delivery],
    })
  } catch (error) {
    console.error("Error fetching delivery:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
