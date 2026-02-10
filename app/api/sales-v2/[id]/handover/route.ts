import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sendSMS } from "@/lib/sms-service"

// POST - Initiate handover process
export async function POST(
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

    // Get sale details
    const saleResult = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        p.project_name,
        pr.product_name,
        pr.unit_no
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.id = ${id}
    `

    if (saleResult.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const sale = saleResult[0]

    // Check if there's outstanding balance
    if (sale.outstanding_amount > 0 && !data.forceHandover) {
      return NextResponse.json({ 
        error: "Outstanding balance exists",
        outstanding: sale.outstanding_amount,
        message: "Please clear all dues before handover or use forceHandover flag"
      }, { status: 400 })
    }

    // Update sale status to 'ready_for_handover' or 'handed_over'
    const newStatus = data.completeHandover ? 'handed_over' : 'ready_for_handover'
    
    await sql`
      UPDATE sales
      SET 
        sale_status = ${newStatus},
        actual_handover_date = ${data.handoverDate || new Date().toISOString().split('T')[0]},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Update product status to 'handed_over'
    if (sale.product_id) {
      await sql`
        UPDATE products 
        SET status = 'handed_over', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sale.product_id}
      `
    }

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description, old_value, new_value
      ) VALUES (
        ${id}, 
        'handover',
        ${data.completeHandover ? 'Property handed over to customer' : 'Property marked ready for handover'},
        ${sale.sale_status},
        ${newStatus}
      )
    `

    // Send SMS notification
    if (data.sendNotification !== false && sale.customer_phone) {
      try {
        await sendSMS({
          templateType: 'handover_notice',
          phone: sale.customer_phone,
          variables: {
            customer_name: sale.customer_name,
            unit_name: sale.product_name + (sale.unit_no ? ` (${sale.unit_no})` : ''),
            project_name: sale.project_name
          },
          referenceType: 'handover',
          referenceId: parseInt(id)
        })
      } catch (smsError) {
        console.error("SMS sending failed:", smsError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: data.completeHandover ? "Handover completed successfully" : "Marked ready for handover",
      status: newStatus
    })
  } catch (error) {
    console.error("Error processing handover:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get handover details/checklist
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

    // Get sale with full details
    const saleResult = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.mailing_address as customer_address,
        c.nid as customer_nid,
        p.project_name,
        p.address as project_address,
        pr.product_name,
        pr.unit_no,
        pr.floor_no,
        pr.size_sqft,
        pr.unit_type
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.id = ${id}
    `

    if (saleResult.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const sale = saleResult[0]

    // Get payment summary
    const paymentSummary = await sql`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_paid,
        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced_cheques
      FROM sale_payments
      WHERE sale_id = ${id} AND is_active = true
    `

    // Get pending schedules
    const pendingSchedules = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(amount - paid_amount), 0) as total_due
      FROM sale_payment_schedules
      WHERE sale_id = ${id} AND status != 'paid' AND is_active = true
    `

    // Get documents
    const documents = await sql`
      SELECT * FROM sale_documents
      WHERE sale_id = ${id} AND is_active = true
    `

    // Handover checklist
    const checklist = {
      all_payments_cleared: sale.outstanding_amount <= 0,
      no_bounced_cheques: parseInt(paymentSummary[0]?.bounced_cheques || 0) === 0,
      agreement_signed: !!sale.agreement_date,
      documents_complete: documents.length >= 3, // Minimum 3 documents expected
      ready_for_handover: sale.sale_status === 'ready_for_handover' || sale.sale_status === 'handed_over',
      handed_over: sale.sale_status === 'handed_over'
    }

    return NextResponse.json({
      sale,
      paymentSummary: paymentSummary[0],
      pendingSchedules: pendingSchedules[0],
      documents,
      checklist,
      canHandover: checklist.all_payments_cleared && checklist.no_bounced_cheques
    })
  } catch (error) {
    console.error("Error fetching handover details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
