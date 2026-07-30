import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// NOTE: the sales table (001 schema + migration 013) has:
//   amount, net_price, total_paid, outstanding_amount — there is NO
//   total_amount / paid_amount / due_amount / quantity.
// COALESCE(net_price, amount) is the sale value; total_paid / outstanding_amount
// track collections.
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
        SUM(COALESCE(net_price, amount, 0)) as total_revenue,
        AVG(COALESCE(net_price, amount, 0)) as average_sale,
        SUM(COALESCE(total_paid, 0)) as total_paid,
        SUM(COALESCE(outstanding_amount, 0)) as total_due
      FROM sales
      WHERE is_active = true
        ${fromDate ? sql`AND sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND project_id = ${projectId}` : sql``}
    `

    // 2. Sales by Customer (Customer Wise Party Ledger)
    const salesByCustomer = await sql`
      SELECT
        c.id,
        c.customer_name,
        c.phone,
        COUNT(s.id) as sale_count,
        SUM(COALESCE(s.net_price, s.amount, 0)) as total_amount,
        SUM(COALESCE(s.total_paid, 0)) as paid_amount,
        SUM(COALESCE(s.outstanding_amount, 0)) as due_amount
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY c.id, c.customer_name, c.phone
      ORDER BY total_amount DESC NULLS LAST
    `

    // 3. Sales by Project/Location (Location Wise Party Ledger Summary)
    const salesByProject = await sql`
      SELECT
        p.id,
        p.project_name,
        pl.name as location_name,
        COUNT(s.id) as sale_count,
        SUM(COALESCE(s.net_price, s.amount, 0)) as total_amount,
        SUM(COALESCE(s.total_paid, 0)) as paid_amount,
        SUM(COALESCE(s.outstanding_amount, 0)) as due_amount
      FROM sales s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN project_locations pl ON p.project_location_id = pl.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY p.id, p.project_name, pl.name
      ORDER BY total_amount DESC NULLS LAST
    `

    // 4. Sales by Seller/Employee (Seller Name Wise Party Ledger)
    const salesBySeller = await sql`
      SELECT
        e.id,
        e.name as seller_name,
        COUNT(s.id) as sale_count,
        SUM(COALESCE(s.net_price, s.amount, 0)) as total_amount,
        SUM(COALESCE(s.total_paid, 0)) as paid_amount,
        SUM(COALESCE(s.outstanding_amount, 0)) as due_amount
      FROM sales s
      LEFT JOIN employees e ON s.seller_id = e.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY e.id, e.name
      ORDER BY total_amount DESC NULLS LAST
    `

    // 5. Sales by Product
    const salesByProduct = await sql`
      SELECT
        pr.id,
        pr.product_name,
        COUNT(s.id) as sale_count,
        SUM(COALESCE(s.net_price, s.amount, 0)) as total_amount
      FROM sales s
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
        ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
        ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      GROUP BY pr.id, pr.product_name
      ORDER BY total_amount DESC NULLS LAST
      LIMIT 20
    `

    // 6. Payment Status Distribution
    const paymentStatus = await sql`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(outstanding_amount, 0) <= 0) as fully_paid,
        COUNT(*) FILTER (WHERE COALESCE(outstanding_amount, 0) > 0 AND COALESCE(total_paid, 0) > 0) as partially_paid,
        COUNT(*) FILTER (WHERE COALESCE(total_paid, 0) = 0) as unpaid,
        SUM(COALESCE(outstanding_amount, 0)) as total_outstanding
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
        SUM(COALESCE(net_price, amount, 0)) as revenue
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
        SUM(COALESCE(s.net_price, s.amount, 0)) as lifetime_value,
        SUM(COALESCE(s.outstanding_amount, 0)) as outstanding_balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.is_active = true
        ${fromDate ? sql`AND s.sale_date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND s.sale_date <= ${toDate}` : sql``}
      GROUP BY c.id, c.customer_name, c.phone, c.email
      ORDER BY lifetime_value DESC NULLS LAST
      LIMIT 10
    `

    const response = {
      summary: {
        totalSales: Number(salesSummary[0].total_sales) || 0,
        totalRevenue: Number(salesSummary[0].total_revenue) || 0,
        averageSale: Number(salesSummary[0].average_sale) || 0,
        totalPaid: Number(salesSummary[0].total_paid) || 0,
        totalDue: Number(salesSummary[0].total_due) || 0,
        collectionRate: Number(salesSummary[0].total_revenue) > 0
          ? ((Number(salesSummary[0].total_paid) / Number(salesSummary[0].total_revenue)) * 100).toFixed(2) + "%"
          : "0%",
      },
      customerLedger: salesByCustomer.map((row) => ({
        customerId: row.id,
        customerName: row.customer_name || "Unknown",
        phone: row.phone,
        saleCount: Number(row.sale_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        dueAmount: Number(row.due_amount) || 0,
      })),
      projectLedger: salesByProject.map((row) => ({
        projectId: row.id,
        projectName: row.project_name || "Unknown",
        locationName: row.location_name,
        saleCount: Number(row.sale_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        dueAmount: Number(row.due_amount) || 0,
      })),
      sellerPerformance: salesBySeller.map((row) => ({
        sellerId: row.id,
        sellerName: row.seller_name || "Unassigned",
        saleCount: Number(row.sale_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        dueAmount: Number(row.due_amount) || 0,
      })),
      productPerformance: salesByProduct.map((row) => ({
        productId: row.id,
        productName: row.product_name || "Unknown",
        saleCount: Number(row.sale_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
      })),
      paymentStatus: {
        fullyPaid: Number(paymentStatus[0].fully_paid) || 0,
        partiallyPaid: Number(paymentStatus[0].partially_paid) || 0,
        unpaid: Number(paymentStatus[0].unpaid) || 0,
        totalOutstanding: Number(paymentStatus[0].total_outstanding) || 0,
      },
      salesTrend: salesTrend.map((row) => ({
        date: row.date,
        saleCount: Number(row.sale_count) || 0,
        revenue: Number(row.revenue) || 0,
      })),
      topCustomers: topCustomers.map((row) => ({
        customerName: row.customer_name || "Unknown",
        phone: row.phone,
        email: row.email,
        purchaseCount: Number(row.purchase_count) || 0,
        lifetimeValue: Number(row.lifetime_value) || 0,
        outstandingBalance: Number(row.outstanding_balance) || 0,
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
