import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// ✅ Use Edge runtime for faster cold starts
export const runtime = 'edge'

// GET: List all purchase orders with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let query = sql`
      SELECT 
        po.*,
        v.vendor_name,
        p.project_name,
        e1.name as prepared_by_name,
        e2.name as approved_by_name,
        COALESCE(SUM(pt.amount), 0) as total_paid,
        po.total_amount - COALESCE(SUM(pt.amount), 0) as total_due,
        CASE 
          WHEN COALESCE(SUM(pt.amount), 0) = 0 THEN 'Unpaid'
          WHEN COALESCE(SUM(pt.amount), 0) >= po.total_amount THEN 'Fully Paid'
          ELSE 'Partial'
        END as payment_status
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN projects p ON po.project_id = p.id
      LEFT JOIN employees e1 ON po.prepared_by = e1.id
      LEFT JOIN employees e2 ON po.approved_by = e2.id
      LEFT JOIN payment_transactions pt ON po.id = pt.po_id AND pt.payment_status = 'Completed'
      WHERE po.is_active = true
    `

    // Add filters
    if (projectId && projectId !== 'all') {
      query = sql`${query} AND po.project_id = ${projectId}`
    }
    if (vendorId && vendorId !== 'all') {
      query = sql`${query} AND po.vendor_id = ${vendorId}`
    }
    if (status && status !== 'all') {
      query = sql`${query} AND po.status = ${status}`
    }
    if (search) {
      query = sql`${query} AND (po.po_number ILIKE ${`%${search}%`} OR v.vendor_name ILIKE ${`%${search}%`})`
    }

    query = sql`${query}
      GROUP BY po.id, v.vendor_name, p.project_name, e1.name, e2.name
      ORDER BY po.order_date DESC, po.created_at DESC
    `

    const orders = await query

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Error fetching purchase orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.vendorId || !data.orderDate || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Vendor, order date, and at least one item are required" },
        { status: 400 }
      )
    }

    // Generate PO number
    const lastPO = await sql`
      SELECT po_number FROM purchase_orders 
      WHERE po_number LIKE ${'PO-' + new Date().getFullYear() + '-%'}
      ORDER BY created_at DESC LIMIT 1
    `
    
    const year = new Date().getFullYear()
    const lastNum = lastPO.length > 0 ? parseInt(lastPO[0].po_number.split('-')[2]) : 0
    const poNumber = `PO-${year}-${String(lastNum + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const discountAmount = data.discountAmount || 0
    const taxAmount = data.taxAmount || 0
    const totalAmount = subtotal - discountAmount + taxAmount

    // Insert purchase order
    const po = await sql`
      INSERT INTO purchase_orders (
        po_number,
        requisition_id,
        vendor_id,
        project_id,
        order_date,
        expected_delivery_date,
        subtotal,
        discount_percentage,
        discount_amount,
        tax_percentage,
        tax_amount,
        total_amount,
        payment_terms,
        delivery_terms,
        terms_and_conditions,
        status,
        notes,
        prepared_by
      ) VALUES (
        ${poNumber},
        ${data.requisitionId || null},
        ${data.vendorId},
        ${data.projectId || null},
        ${data.orderDate},
        ${data.expectedDeliveryDate || null},
        ${subtotal},
        ${data.discountPercentage || 0},
        ${discountAmount},
        ${data.taxPercentage || 0},
        ${taxAmount},
        ${totalAmount},
        ${data.paymentTerms || null},
        ${data.deliveryTerms || null},
        ${data.termsAndConditions || null},
        ${data.status || 'Draft'},
        ${data.notes || null},
        ${user.id || null}
      )
      RETURNING *
    `

    // Insert purchase order items
    for (const item of data.items) {
      await sql`
        INSERT INTO purchase_order_items (
          po_id,
          requisition_item_id,
          expense_head_id,
          material_type,
          material_specification,
          description,
          qty,
          unit_of_measurement,
          rate,
          amount,
          remaining_qty
        ) VALUES (
          ${po[0].id},
          ${item.requisitionItemId || null},
          ${item.expenseHeadId},
          ${item.materialType || null},
          ${item.materialSpecification || null},
          ${item.description || null},
          ${item.qty},
          ${item.unitOfMeasurement || null},
          ${item.rate},
          ${item.amount},
          ${item.qty}
        )
      `
    }

    // Create payment schedules if provided
    if (data.paymentSchedules && data.paymentSchedules.length > 0) {
      for (const schedule of data.paymentSchedules) {
        await sql`
          INSERT INTO payment_schedules (
            po_id,
            schedule_number,
            payment_type,
            payment_percentage,
            scheduled_amount,
            due_date,
            payment_condition,
            is_conditional
          ) VALUES (
            ${po[0].id},
            ${schedule.scheduleNumber || null},
            ${schedule.paymentType},
            ${schedule.paymentPercentage || null},
            ${schedule.scheduledAmount},
            ${schedule.dueDate || null},
            ${schedule.paymentCondition || null},
            ${schedule.isConditional || false}
          )
        `
      }
    }

    return NextResponse.json({ success: true, order: po[0] })
  } catch (error) {
    console.error("[v0] Error creating purchase order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
