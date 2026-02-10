import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Fetch single sale with all details
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

    // Fetch sale with related data
    const saleResult = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.mailing_address as customer_address,
        c.nid as customer_nid,
        c.father_or_husband_name,
        e.name as seller_name,
        p.project_name,
        p.address as project_address,
        pr.product_name,
        pr.unit_no,
        pr.floor_no,
        pr.size_sqft,
        pr.unit_type,
        pr.bedrooms,
        pr.bathrooms,
        pr.facing
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN employees e ON s.seller_id = e.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.id = ${id} AND s.is_active = true
    `

    if (saleResult.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Fetch payment schedules
    const schedules = await sql`
      SELECT * FROM sale_payment_schedules
      WHERE sale_id = ${id} AND is_active = true
      ORDER BY due_date ASC
    `

    // Fetch payments
    const payments = await sql`
      SELECT 
        sp.*,
        bca.account_title as bank_account_name
      FROM sale_payments sp
      LEFT JOIN bank_cash_accounts bca ON sp.bank_cash_id = bca.id
      WHERE sp.sale_id = ${id} AND sp.is_active = true
      ORDER BY sp.payment_date DESC
    `

    // Fetch documents
    const documents = await sql`
      SELECT 
        sd.*,
        e.name as uploaded_by_name
      FROM sale_documents sd
      LEFT JOIN employees e ON sd.uploaded_by = e.id
      WHERE sd.sale_id = ${id} AND sd.is_active = true
      ORDER BY sd.created_at DESC
    `

    // Fetch activity log
    const activities = await sql`
      SELECT 
        sa.*,
        e.name as performed_by_name
      FROM sale_activities sa
      LEFT JOIN employees e ON sa.performed_by = e.id
      WHERE sa.sale_id = ${id}
      ORDER BY sa.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      sale: saleResult[0],
      schedules,
      payments,
      documents,
      activities
    })
  } catch (error) {
    console.error("Error fetching sale:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update sale
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

    // Get current sale for comparison
    const currentSale = await sql`
      SELECT * FROM sales WHERE id = ${id}
    `

    if (currentSale.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const oldStatus = currentSale[0].sale_status

    // Update sale
    const result = await sql`
      UPDATE sales
      SET 
        customer_id = COALESCE(${data.customerId ? parseInt(data.customerId) : null}, customer_id),
        seller_id = COALESCE(${data.sellerId ? parseInt(data.sellerId) : null}, seller_id),
        project_id = COALESCE(${data.projectId ? parseInt(data.projectId) : null}, project_id),
        product_id = COALESCE(${data.productId ? parseInt(data.productId) : null}, product_id),
        sale_status = COALESCE(${data.saleStatus}, sale_status),
        base_price = COALESCE(${data.basePrice ? parseFloat(data.basePrice) : null}, base_price),
        discount_amount = COALESCE(${data.discountAmount ? parseFloat(data.discountAmount) : null}, discount_amount),
        discount_percent = COALESCE(${data.discountPercent ? parseFloat(data.discountPercent) : null}, discount_percent),
        net_price = COALESCE(${data.netPrice ? parseFloat(data.netPrice) : null}, net_price),
        agreement_date = COALESCE(${data.agreementDate}, agreement_date),
        agreement_no = COALESCE(${data.agreementNo}, agreement_no),
        expected_handover_date = COALESCE(${data.expectedHandoverDate}, expected_handover_date),
        actual_handover_date = COALESCE(${data.actualHandoverDate}, actual_handover_date),
        notes = COALESCE(${data.notes}, notes),
        nominee_name = COALESCE(${data.nomineeName}, nominee_name),
        nominee_phone = COALESCE(${data.nomineePhone}, nominee_phone),
        nominee_relation = COALESCE(${data.nomineeRelation}, nominee_relation),
        nominee_nid = COALESCE(${data.nomineeNid}, nominee_nid),
        reference_by = COALESCE(${data.referenceBy}, reference_by),
        commission_amount = COALESCE(${data.commissionAmount ? parseFloat(data.commissionAmount) : null}, commission_amount),
        terms_conditions = COALESCE(${data.termsConditions}, terms_conditions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    // Log status change if changed
    if (data.saleStatus && data.saleStatus !== oldStatus) {
      await sql`
        INSERT INTO sale_activities (
          sale_id, activity_type, description, old_value, new_value
        ) VALUES (
          ${id}, 'status_changed', 
          ${'Status changed from ' + oldStatus + ' to ' + data.saleStatus},
          ${oldStatus}, ${data.saleStatus}
        )
      `

      // Update product status based on sale status
      const productId = data.productId || currentSale[0].product_id
      if (productId) {
        let productStatus = 'booked'
        if (data.saleStatus === 'completed' || data.saleStatus === 'handed_over') {
          productStatus = 'sold'
        } else if (data.saleStatus === 'cancelled') {
          productStatus = 'available'
        }
        
        await sql`
          UPDATE products 
          SET status = ${productStatus}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${productId}
        `
      }
    }

    return NextResponse.json({ success: true, sale: result[0] })
  } catch (error) {
    console.error("Error updating sale:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Soft delete sale
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  let step = 'init'
  try {
    step = 'auth'
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    step = 'get-params'
    const { id } = await params
    console.log('[sales-v2] Deleting sale:', id)

    step = 'get-sale'
    // Get sale to restore product status
    const sale = await sql`
      SELECT product_id FROM sales WHERE id = ${id}
    `

    step = 'soft-delete'
    // Soft delete sale
    await sql`
      UPDATE sales
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    step = 'restore-product'
    // Restore product to available
    if (sale[0]?.product_id) {
      await sql`
        UPDATE products 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sale[0].product_id}
      `
    }

    step = 'log-activity'
    // Log activity - performed_by is integer but we need to handle UUID user.id
    // For now, just log the sale_id without performed_by or use null
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${parseInt(id)}, 'cancelled', 'Sale cancelled/deleted'
      )
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[sales-v2] Error deleting sale at step '${step}':`, error)
    return NextResponse.json({ 
      error: "Internal server error",
      step,
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
