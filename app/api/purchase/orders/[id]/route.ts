import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

// GET: Get single purchase order with details
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

    // Get purchase order
    const po = await sql`
      SELECT 
        po.*,
        v.vendor_name,
        v.phone as vendor_phone,
        v.email as vendor_email,
        v.mailing_address as vendor_address,
        p.project_name,
        e1.name as prepared_by_name,
        e2.name as approved_by_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN projects p ON po.project_id = p.id
      LEFT JOIN employees e1 ON po.prepared_by = e1.id
      LEFT JOIN employees e2 ON po.approved_by = e2.id
      WHERE po.id = ${id} AND po.is_active = true
      LIMIT 1
    `

    if (po.length === 0) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    // Get items
    const items = await sql`
      SELECT 
        poi.*,
        ieh.head_name as expense_head_name
      FROM purchase_order_items poi
      LEFT JOIN income_expense_heads ieh ON poi.expense_head_id = ieh.id
      WHERE poi.po_id = ${id}
      ORDER BY poi.id
    `

    // Get payment schedules
    const schedules = await sql`
      SELECT *
      FROM payment_schedules
      WHERE po_id = ${id} AND is_active = true
      ORDER BY due_date ASC
    `

    // Get payment transactions
    const payments = await sql`
      SELECT 
        pt.*,
        e.name as verified_by_name
      FROM payment_transactions pt
      LEFT JOIN employees e ON pt.verified_by = e.id
      WHERE pt.po_id = ${id} AND pt.is_active = true
      ORDER BY pt.payment_date DESC
    `

    // Get deliveries
    const deliveries = await sql`
      SELECT 
        md.*,
        e1.name as received_by_name,
        e2.name as quality_checked_by_name
      FROM material_deliveries md
      LEFT JOIN employees e1 ON md.received_by = e1.id
      LEFT JOIN employees e2 ON md.quality_checked_by = e2.id
      WHERE md.po_id = ${id} AND md.is_active = true
      ORDER BY md.delivery_date DESC
    `

    return NextResponse.json({
      order: po[0],
      items,
      schedules,
      payments,
      deliveries
    })
  } catch (error) {
    console.error("[v0] Error fetching purchase order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const po = await sql`
      UPDATE purchase_orders SET
        vendor_id = ${data.vendorId},
        project_id = ${data.projectId || null},
        order_date = ${data.orderDate},
        expected_delivery_date = ${data.expectedDeliveryDate || null},
        subtotal = ${data.subtotal},
        discount_percentage = ${data.discountPercentage || 0},
        discount_amount = ${data.discountAmount || 0},
        tax_percentage = ${data.taxPercentage || 0},
        tax_amount = ${data.taxAmount || 0},
        total_amount = ${data.totalAmount},
        payment_terms = ${data.paymentTerms || null},
        delivery_terms = ${data.deliveryTerms || null},
        terms_and_conditions = ${data.termsAndConditions || null},
        status = ${data.status},
        notes = ${data.notes || null},
        approved_by = ${data.approvedBy || null},
        approval_date = ${data.approvalDate || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, order: po[0] })
  } catch (error) {
    console.error("[v0] Error updating purchase order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Soft delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`
      UPDATE purchase_orders SET
        is_active = false,
        status = 'Cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true, message: "Purchase order cancelled" })
  } catch (error) {
    console.error("[v0] Error deleting purchase order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
