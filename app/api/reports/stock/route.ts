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
    const productId = searchParams.get("productId")
    const projectId = searchParams.get("projectId")

    console.log("[Stock Reports] Generating reports for:", { productId, projectId })

    // 1. Current Stock Levels by Product
    const stockLevels = await sql`
      SELECT 
        p.id,
        p.product_name,
        p.unit,
        COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN pr.type = 'OUT' THEN pr.quantity ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) as current_stock,
        p.reorder_level
      FROM products p
      LEFT JOIN purchase_requisitions pr ON p.id = pr.product_id AND pr.is_confirmed = true
      WHERE p.is_active = true
        ${productId ? sql`AND p.id = ${productId}` : sql``}
      GROUP BY p.id, p.product_name, p.unit, p.reorder_level
      ORDER BY p.product_name
    `

    // 2. Low Stock Alerts (below reorder level)
    const lowStockAlerts = await sql`
      SELECT 
        p.id,
        p.product_name,
        p.unit,
        COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) as current_stock,
        p.reorder_level,
        (p.reorder_level - COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0)) as shortage
      FROM products p
      LEFT JOIN purchase_requisitions pr ON p.id = pr.product_id AND pr.is_confirmed = true
      WHERE p.is_active = true
        AND p.reorder_level IS NOT NULL
      GROUP BY p.id, p.product_name, p.unit, p.reorder_level
      HAVING COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) < p.reorder_level
      ORDER BY shortage DESC
    `

    // 3. Stock Movements (Recent Transactions)
    const stockMovements = await sql`
      SELECT 
        pr.id,
        pr.requisition_date as movement_date,
        pr.type,
        pr.quantity,
        p.product_name,
        p.unit,
        proj.project_name,
        v.vendor_name,
        pr.remarks
      FROM purchase_requisitions pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN projects proj ON pr.project_id = proj.id
      LEFT JOIN vendors v ON pr.vendor_id = v.id
      WHERE pr.is_confirmed = true
        ${productId ? sql`AND pr.product_id = ${productId}` : sql``}
        ${projectId ? sql`AND pr.project_id = ${projectId}` : sql``}
      ORDER BY pr.requisition_date DESC
      LIMIT 50
    `

    // 4. Stock Value Analysis
    const stockValue = await sql`
      SELECT 
        p.id,
        p.product_name,
        COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) as current_stock,
        AVG(CASE WHEN pr.type = 'IN' THEN pr.unit_price ELSE NULL END) as avg_purchase_price,
        (COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) * 
         AVG(CASE WHEN pr.type = 'IN' THEN pr.unit_price ELSE NULL END)) as stock_value
      FROM products p
      LEFT JOIN purchase_requisitions pr ON p.id = pr.product_id AND pr.is_confirmed = true
      WHERE p.is_active = true
        ${productId ? sql`AND p.id = ${productId}` : sql``}
      GROUP BY p.id, p.product_name
      HAVING COALESCE(SUM(CASE WHEN pr.type = 'IN' THEN pr.quantity ELSE -pr.quantity END), 0) > 0
      ORDER BY stock_value DESC
    `

    // 5. Product Consumption by Project
    const projectConsumption = await sql`
      SELECT 
        proj.id as project_id,
        proj.project_name,
        p.product_name,
        SUM(pr.quantity) as total_consumed,
        p.unit
      FROM purchase_requisitions pr
      INNER JOIN products p ON pr.product_id = p.id
      INNER JOIN projects proj ON pr.project_id = proj.id
      WHERE pr.type = 'OUT'
        AND pr.is_confirmed = true
        ${productId ? sql`AND pr.product_id = ${productId}` : sql``}
        ${projectId ? sql`AND pr.project_id = ${projectId}` : sql``}
      GROUP BY proj.id, proj.project_name, p.id, p.product_name, p.unit
      ORDER BY total_consumed DESC
      LIMIT 20
    `

    // 6. Vendor Purchase Analysis
    const vendorAnalysis = await sql`
      SELECT 
        v.id,
        v.vendor_name,
        COUNT(DISTINCT pr.id) as purchase_count,
        COUNT(DISTINCT pr.product_id) as product_variety,
        SUM(pr.quantity) as total_quantity,
        SUM(pr.total_price) as total_value
      FROM purchase_requisitions pr
      INNER JOIN vendors v ON pr.vendor_id = v.id
      WHERE pr.type = 'IN'
        AND pr.is_confirmed = true
      GROUP BY v.id, v.vendor_name
      ORDER BY total_value DESC
      LIMIT 10
    `

    // 7. Stock Movement Trend (last 30 days)
    const movementTrend = await sql`
      SELECT 
        DATE(requisition_date) as date,
        type,
        COUNT(*) as transaction_count,
        SUM(quantity) as total_quantity
      FROM purchase_requisitions
      WHERE is_confirmed = true
        AND requisition_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(requisition_date), type
      ORDER BY date DESC
    `

    // 8. Summary Statistics
    const summary = await sql`
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        SUM(COALESCE(stock.current_stock, 0)) as total_stock_quantity,
        COUNT(*) FILTER (WHERE stock.current_stock > 0) as products_in_stock,
        COUNT(*) FILTER (WHERE stock.current_stock = 0) as out_of_stock_products,
        COUNT(*) FILTER (WHERE stock.current_stock < p.reorder_level AND p.reorder_level IS NOT NULL) as low_stock_products
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as current_stock
        FROM purchase_requisitions
        WHERE is_confirmed = true
        GROUP BY product_id
      ) stock ON p.id = stock.product_id
      WHERE p.is_active = true
    `

    const response = {
      summary: {
        totalProducts: Number(summary[0].total_products),
        totalStockQuantity: Number(summary[0].total_stock_quantity),
        productsInStock: Number(summary[0].products_in_stock),
        outOfStockProducts: Number(summary[0].out_of_stock_products),
        lowStockProducts: Number(summary[0].low_stock_products),
        totalStockValue: stockValue.reduce((sum, item) => sum + Number(item.stock_value || 0), 0),
      },
      stockLevels: stockLevels.map((row) => ({
        productId: row.id,
        productName: row.product_name,
        unit: row.unit,
        totalIn: Number(row.total_in),
        totalOut: Number(row.total_out),
        currentStock: Number(row.current_stock),
        reorderLevel: row.reorder_level ? Number(row.reorder_level) : null,
        status: row.reorder_level && Number(row.current_stock) < Number(row.reorder_level) 
          ? "Low Stock" 
          : Number(row.current_stock) === 0 
          ? "Out of Stock" 
          : "In Stock",
      })),
      lowStockAlerts: lowStockAlerts.map((row) => ({
        productId: row.id,
        productName: row.product_name,
        unit: row.unit,
        currentStock: Number(row.current_stock),
        reorderLevel: Number(row.reorder_level),
        shortage: Number(row.shortage),
      })),
      recentMovements: stockMovements.map((row) => ({
        id: row.id,
        date: row.movement_date,
        type: row.type,
        quantity: Number(row.quantity),
        productName: row.product_name,
        unit: row.unit,
        projectName: row.project_name,
        vendorName: row.vendor_name,
        remarks: row.remarks,
      })),
      stockValue: stockValue.map((row) => ({
        productId: row.id,
        productName: row.product_name,
        currentStock: Number(row.current_stock),
        avgPurchasePrice: Number(row.avg_purchase_price || 0),
        stockValue: Number(row.stock_value || 0),
      })),
      projectConsumption: projectConsumption.map((row) => ({
        projectId: row.project_id,
        projectName: row.project_name,
        productName: row.product_name,
        totalConsumed: Number(row.total_consumed),
        unit: row.unit,
      })),
      vendorAnalysis: vendorAnalysis.map((row) => ({
        vendorId: row.id,
        vendorName: row.vendor_name,
        purchaseCount: Number(row.purchase_count),
        productVariety: Number(row.product_variety),
        totalQuantity: Number(row.total_quantity),
        totalValue: Number(row.total_value),
      })),
      movementTrend: movementTrend.map((row) => ({
        date: row.date,
        type: row.type,
        transactionCount: Number(row.transaction_count),
        totalQuantity: Number(row.total_quantity),
      })),
    }

    const duration = Date.now() - handlerStart
    console.log(`[Stock Reports] Reports generated successfully in ${duration}ms`)
    return NextResponse.json(response, {
      headers: {
        // Let CDNs cache this for 60s and serve stale while revalidating for 30s
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    })
  } catch (error) {
    console.error("[Stock Reports] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
