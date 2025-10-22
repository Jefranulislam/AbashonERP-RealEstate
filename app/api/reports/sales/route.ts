import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const handlerStart = Date.now()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const customerId = searchParams.get("customerId")
    const projectId = searchParams.get("projectId")

    console.log("[Sales Reports] Generating reports for:", { fromDate, toDate, customerId, projectId })

    // 1. Sales Summary
    const salesSummary = await sql`
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale,
        SUM(paid_amount) as total_paid,
        SUM(due_amount) as total_due
      FROM sales
      WHERE is_active = true
        ${fromDate ? sql`AND sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND project_id = ${projectId}` : sql``}
    `

    // 2. Sales by Customer
    const salesByCustomer = await sql`
      SELECT 
        c.id,
        c.customer_name,
        COUNT(s.id) as sale_count,
        SUM(s.total_amount) as total_amount,
        SUM(s.paid_amount) as paid_amount,
        SUM(s.due_amount) as due_amount
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY c.id, c.customer_name
      ORDER BY total_amount DESC
      LIMIT 20
    `

    // 3. Sales by Project/Location
    const salesByProject = await sql`
      SELECT 
        p.id,
        p.project_name,
        pl.location_name,
        COUNT(s.id) as sale_count,
        SUM(s.total_amount) as total_amount,
        SUM(s.paid_amount) as paid_amount,
        SUM(s.due_amount) as due_amount
      FROM sales s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN project_locations pl ON p.project_location_id = pl.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY p.id, p.project_name, pl.location_name
      ORDER BY total_amount DESC
      LIMIT 20
    `

    // 4. Sales by Seller/Employee
    const salesBySeller = await sql`
      SELECT 
        e.id,
        e.name as seller_name,
        COUNT(s.id) as sale_count,
        SUM(s.total_amount) as total_amount,
        SUM(s.paid_amount) as paid_amount,
        SUM(s.due_amount) as due_amount
      FROM sales s
      LEFT JOIN employees e ON s.seller_id = e.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY e.id, e.name
      ORDER BY total_amount DESC
      LIMIT 10
    `

    // 5. Sales by Product
    const salesByProduct = await sql`
      SELECT 
        pr.id,
        pr.product_name,
        COUNT(s.id) as sale_count,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as total_amount
      FROM sales s
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY pr.id, pr.product_name
      ORDER BY total_amount DESC
      LIMIT 20
    `

    // 6. Payment Status Distribution
    const paymentStatus = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE due_amount = 0) as fully_paid,
        COUNT(*) FILTER (WHERE due_amount > 0 AND paid_amount > 0) as partially_paid,
        COUNT(*) FILTER (WHERE paid_amount = 0) as unpaid,
        SUM(due_amount) as total_outstanding
      FROM sales
      WHERE is_active = true
        ${fromDate ? sql`AND sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND project_id = ${projectId}` : sql``}
    `

    // 7. Daily Sales Trend (last 30 days)
    const salesTrend = await sql`
      SELECT 
        DATE(sale_date) as date,
        COUNT(*) as sale_count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE is_active = true
        AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(sale_date)
      ORDER BY date DESC
    `

    // 8. Top Customers by Revenue
    const topCustomers = await sql`
      SELECT 
        c.customer_name,
        c.phone,
        c.email,
        COUNT(s.id) as purchase_count,
        SUM(s.total_amount) as lifetime_value,
        SUM(s.due_amount) as outstanding_balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
      GROUP BY c.id, c.customer_name, c.phone, c.email
      ORDER BY lifetime_value DESC
      LIMIT 10
    `

    const response = {
      summary: {
        totalSales: Number(salesSummary[0].total_sales) || 0,
        totalRevenue: Number(salesSummary[0].total_revenue) || 0,
        averageSale: Number(salesSummary[0].average_sale) || 0,
        totalPaid: Number(salesSummary[0].total_paid) || 0,
        totalDue: Number(salesSummary[0].total_due) || 0,
        collectionRate: salesSummary[0].total_revenue > 0 
          ? ((Number(salesSummary[0].total_paid) / Number(salesSummary[0].total_revenue)) * 100).toFixed(2) + "%"
          : "0%",
      },
      customerLedger: salesByCustomer.map((row) => ({
        customerId: row.id,
        customerName: row.customer_name,
        saleCount: Number(row.sale_count),
        totalAmount: Number(row.total_amount),
        paidAmount: Number(row.paid_amount),
        dueAmount: Number(row.due_amount),
      })),
      projectLedger: salesByProject.map((row) => ({
        projectId: row.id,
        projectName: row.project_name,
        locationName: row.location_name,
        saleCount: Number(row.sale_count),
        totalAmount: Number(row.total_amount),
        paidAmount: Number(row.paid_amount),
        dueAmount: Number(row.due_amount),
      })),
      sellerPerformance: salesBySeller.map((row) => ({
        sellerId: row.id,
        sellerName: row.seller_name || "Unassigned",
        saleCount: Number(row.sale_count),
        totalAmount: Number(row.total_amount),
        paidAmount: Number(row.paid_amount),
        dueAmount: Number(row.due_amount),
      })),
      productPerformance: salesByProduct.map((row) => ({
        productId: row.id,
        productName: row.product_name,
        saleCount: Number(row.sale_count),
        totalQuantity: Number(row.total_quantity),
        totalAmount: Number(row.total_amount),
      })),
      paymentStatus: {
        fullyPaid: Number(paymentStatus[0].fully_paid),
        partiallyPaid: Number(paymentStatus[0].partially_paid),
        unpaid: Number(paymentStatus[0].unpaid),
        totalOutstanding: Number(paymentStatus[0].total_outstanding),
      },
      salesTrend: salesTrend.map((row) => ({
        date: row.date,
        saleCount: Number(row.sale_count),
        revenue: Number(row.revenue),
      })),
      topCustomers: topCustomers.map((row) => ({
        customerName: row.customer_name,
        phone: row.phone,
        email: row.email,
        purchaseCount: Number(row.purchase_count),
        lifetimeValue: Number(row.lifetime_value),
        outstandingBalance: Number(row.outstanding_balance),
      })),
    }

    const duration = Date.now() - handlerStart
    console.log(`[Sales Reports] Reports generated successfully in ${duration}ms`)
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    })
  } catch (error) {
    console.error("[Sales Reports] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
