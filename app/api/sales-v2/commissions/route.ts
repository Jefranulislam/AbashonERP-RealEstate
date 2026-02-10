import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Get commission details for a sale or all commissions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get("saleId")
    const status = searchParams.get("status") // 'pending', 'paid', 'all'
    const sellerId = searchParams.get("sellerId")

    let commissions

    if (saleId) {
      // Get commission for specific sale
      commissions = await sql`
        SELECT 
          s.id as sale_id,
          s.sale_no,
          s.net_price,
          s.commission_amount,
          s.commission_paid,
          s.reference_by,
          s.booking_date,
          c.customer_name,
          p.project_name,
          pr.product_name,
          pr.unit_no,
          e.name as seller_name,
          e.id as seller_id
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN products pr ON s.product_id = pr.id
        LEFT JOIN employees e ON s.seller_id = e.id
        WHERE s.id = ${saleId} AND s.is_active = true
      `
    } else {
      // Get all commissions with filters
      commissions = await sql`
        SELECT 
          s.id as sale_id,
          s.sale_no,
          s.net_price,
          s.commission_amount,
          s.commission_paid,
          s.reference_by,
          s.booking_date,
          c.customer_name,
          p.project_name,
          pr.product_name,
          pr.unit_no,
          e.name as seller_name,
          e.id as seller_id
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN projects p ON s.project_id = p.id
        LEFT JOIN products pr ON s.product_id = pr.id
        LEFT JOIN employees e ON s.seller_id = e.id
        WHERE s.is_active = true
          AND s.commission_amount > 0
          ${status === 'pending' ? sql`AND s.commission_paid = false` : sql``}
          ${status === 'paid' ? sql`AND s.commission_paid = true` : sql``}
          ${sellerId ? sql`AND s.seller_id = ${sellerId}` : sql``}
        ORDER BY s.booking_date DESC
      `
    }

    // Calculate totals
    const totals = await sql`
      SELECT 
        COUNT(*) as total_sales_with_commission,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COALESCE(SUM(CASE WHEN commission_paid = true THEN commission_amount ELSE 0 END), 0) as paid_commission,
        COALESCE(SUM(CASE WHEN commission_paid = false THEN commission_amount ELSE 0 END), 0) as pending_commission
      FROM sales
      WHERE is_active = true AND commission_amount > 0
      ${sellerId ? sql`AND seller_id = ${sellerId}` : sql``}
    `

    // Get commission by seller
    const bySeller = await sql`
      SELECT 
        e.id as seller_id,
        e.name as seller_name,
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.commission_amount), 0) as total_commission,
        COALESCE(SUM(CASE WHEN s.commission_paid = true THEN s.commission_amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN s.commission_paid = false THEN s.commission_amount ELSE 0 END), 0) as pending
      FROM employees e
      LEFT JOIN sales s ON e.id = s.seller_id AND s.is_active = true AND s.commission_amount > 0
      WHERE e.is_active = true
      GROUP BY e.id, e.name
      HAVING COUNT(s.id) > 0
      ORDER BY total_commission DESC
    `

    return NextResponse.json({
      commissions,
      totals: totals[0],
      bySeller
    })
  } catch (error) {
    console.error("Error fetching commissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Mark commission as paid
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { saleId, commissionAmount, paymentDate, paymentMethod, remarks } = data

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }

    // Get current sale
    const sale = await sql`
      SELECT * FROM sales WHERE id = ${saleId}
    `

    if (sale.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Update commission status
    await sql`
      UPDATE sales
      SET 
        commission_paid = true,
        commission_amount = COALESCE(${commissionAmount ? parseFloat(commissionAmount) : null}, commission_amount),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${saleId}
    `

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${saleId},
        'commission_paid',
        ${'Commission of ' + (commissionAmount || sale[0].commission_amount) + ' paid via ' + (paymentMethod || 'cash')}
      )
    `

    return NextResponse.json({ 
      success: true, 
      message: "Commission marked as paid"
    })
  } catch (error) {
    console.error("Error updating commission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update commission amount
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { saleId, commissionAmount, referenceBy } = data

    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 })
    }

    // Get old values for logging
    const oldSale = await sql`SELECT commission_amount, reference_by FROM sales WHERE id = ${saleId}`

    await sql`
      UPDATE sales
      SET 
        commission_amount = COALESCE(${commissionAmount ? parseFloat(commissionAmount) : null}, commission_amount),
        reference_by = COALESCE(${referenceBy}, reference_by),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${saleId}
    `

    // Log activity
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description, old_value, new_value
      ) VALUES (
        ${saleId},
        'commission_updated',
        'Commission details updated',
        ${JSON.stringify({ commission: oldSale[0]?.commission_amount, reference: oldSale[0]?.reference_by })},
        ${JSON.stringify({ commission: commissionAmount, reference: referenceBy })}
      )
    `

    return NextResponse.json({ success: true, message: "Commission updated" })
  } catch (error) {
    console.error("Error updating commission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
