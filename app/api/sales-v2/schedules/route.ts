import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Fetch payment schedules for a sale
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const saleId = searchParams.get("saleId")
    const status = searchParams.get("status")
    const overdue = searchParams.get("overdue")

    let schedules

    if (overdue === "true") {
      // Get all overdue schedules across all sales
      schedules = await sql`
        SELECT 
          sps.*,
          s.sale_no,
          c.customer_name,
          c.phone as customer_phone,
          p.project_name,
          pr.product_name,
          pr.unit_no,
          (CURRENT_DATE - sps.due_date) as days_overdue
        FROM sale_payment_schedules sps
        JOIN sales s ON sps.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN products pr ON s.product_id = pr.id
        WHERE sps.is_active = true 
          AND (COALESCE(sps.amount, 0) - COALESCE(sps.paid_amount, 0)) > 0
          AND sps.due_date < CURRENT_DATE
          AND s.is_active = true
        ORDER BY sps.due_date ASC
      `
    } else if (saleId) {
      schedules = await sql`
        SELECT * FROM sale_payment_schedules
        WHERE sale_id = ${saleId} 
          AND is_active = true
          ${status ? sql`AND status = ${status}` : sql``}
        ORDER BY due_date ASC
      `
    } else {
      // Get upcoming due payments (next 30 days)
      schedules = await sql`
        SELECT 
          sps.*,
          s.sale_no,
          c.customer_name,
          c.phone as customer_phone,
          p.project_name,
          pr.product_name,
          pr.unit_no
        FROM sale_payment_schedules sps
        JOIN sales s ON sps.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN products pr ON s.product_id = pr.id
        WHERE sps.is_active = true 
          AND (COALESCE(sps.amount, 0) - COALESCE(sps.paid_amount, 0)) > 0
          AND sps.due_date >= CURRENT_DATE
          AND sps.due_date <= (CURRENT_DATE + INTERVAL '30 days')
          AND s.is_active = true
        ORDER BY sps.due_date ASC
      `
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching payment schedules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create payment schedule manually
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const result = await sql`
      INSERT INTO sale_payment_schedules (
        sale_id, schedule_type, installment_no, description,
        due_date, amount, status
      ) VALUES (
        ${data.saleId},
        ${data.scheduleType || 'installment'},
        ${data.installmentNo || null},
        ${data.description || null},
        ${data.dueDate},
        ${parseFloat(data.amount)},
        'pending'
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, schedule: result[0] })
  } catch (error) {
    console.error("Error creating payment schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update payment schedule
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const result = await sql`
      UPDATE sale_payment_schedules
      SET 
        due_date = COALESCE(${data.dueDate}, due_date),
        amount = COALESCE(${data.amount ? parseFloat(data.amount) : null}, amount),
        description = COALESCE(${data.description}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${data.id}
      RETURNING *
    `

    return NextResponse.json({ success: true, schedule: result[0] })
  } catch (error) {
    console.error("Error updating payment schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
