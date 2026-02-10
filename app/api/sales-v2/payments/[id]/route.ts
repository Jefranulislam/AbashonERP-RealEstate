import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Fetch single payment details
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

    const payment = await sql`
      SELECT 
        sp.*,
        s.sale_no,
        s.net_price,
        s.total_paid,
        s.outstanding_amount,
        c.customer_name,
        c.phone as customer_phone,
        c.mailing_address as customer_address,
        p.project_name,
        p.address as project_address,
        pr.product_name,
        pr.unit_no,
        pr.floor_no,
        bca.account_title as bank_account_name,
        e.name as received_by_name
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      LEFT JOIN bank_cash_accounts bca ON sp.bank_cash_id = bca.id
      LEFT JOIN employees e ON sp.received_by = e.id
      WHERE sp.id = ${id}
    `

    if (payment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ payment: payment[0] })
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update payment (mainly for cheque status)
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

    const oldPayment = await sql`SELECT * FROM sale_payments WHERE id = ${id}`
    
    const result = await sql`
      UPDATE sale_payments
      SET 
        status = COALESCE(${data.status}, status),
        remarks = COALESCE(${data.remarks}, remarks),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    // Log if status changed (especially for cheque bounce)
    if (data.status && data.status !== oldPayment[0].status) {
      await sql`
        INSERT INTO sale_activities (
          sale_id, activity_type, description, old_value, new_value
        ) VALUES (
          ${oldPayment[0].sale_id}, 
          'payment_status_changed', 
          ${'Payment ' + oldPayment[0].receipt_no + ' status changed to ' + data.status},
          ${oldPayment[0].status},
          ${data.status}
        )
      `
    }

    return NextResponse.json({ success: true, payment: result[0] })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Cancel/void payment
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

    const payment = await sql`SELECT * FROM sale_payments WHERE id = ${id}`
    
    if (payment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Soft delete / cancel
    await sql`
      UPDATE sale_payments
      SET 
        status = 'cancelled',
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${payment[0].sale_id}, 
        'payment_cancelled', 
        ${'Payment ' + payment[0].receipt_no + ' of amount ' + payment[0].amount + ' cancelled'}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
