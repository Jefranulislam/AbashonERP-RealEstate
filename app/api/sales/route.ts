import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customerId")
    const search = searchParams.get("search")

    let query = `
      SELECT 
        s.*,
        c.customer_name,
        e.name as seller_name,
        p.project_name,
        pr.product_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN employees e ON s.seller_id = e.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.is_active = true
    `

    const params: any[] = []

    if (customerId) {
      query += ` AND s.customer_id = $${params.length + 1}`
      params.push(customerId)
    }

    if (search) {
      query += ` AND (c.customer_name ILIKE $${params.length + 1} OR p.project_name ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY s.sale_date DESC`

    console.log("[v0] Fetching sales with query:", query)
    const sales = await sql(query, params)
    console.log("[v0] Sales fetched:", sales.length)

    return NextResponse.json({ sales })
  } catch (error) {
    console.error("[v0] Error fetching sales:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("[v0] Creating sale with data:", data)

    const result = await sql`
      INSERT INTO sales (
        customer_id, seller_id, project_id, product_id, sale_date, amount
      ) VALUES (
        ${data.customerId ? Number.parseInt(data.customerId) : null}, 
        ${data.sellerId ? Number.parseInt(data.sellerId) : null}, 
        ${data.projectId ? Number.parseInt(data.projectId) : null}, 
        ${data.productId ? Number.parseInt(data.productId) : null}, 
        ${data.saleDate || null}, 
        ${data.amount ? Number.parseFloat(data.amount) : null}
      )
      RETURNING *
    `

    console.log("[v0] Sale created:", result[0])
    return NextResponse.json({ success: true, sale: result[0] })
  } catch (error) {
    console.error("[v0] Error creating sale:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
