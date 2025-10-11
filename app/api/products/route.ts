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
    const projectId = searchParams.get("projectId")

    let query = `
      SELECT 
        p.*,
        pr.project_name
      FROM products p
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.is_active = true
    `

    const params: any[] = []

    if (projectId) {
      query += ` AND p.project_id = $${params.length + 1}`
      params.push(projectId)
    }

    query += ` ORDER BY p.created_at DESC`

    const products = await sql(query, params)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
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
    console.log("[v0] Received product data:", data)

    const result = await sql`
      INSERT INTO products (
        project_id, product_name, product_type, size, price, description, is_active
      ) VALUES (
        ${data.projectId}, 
        ${data.productName}, 
        ${data.productType || null}, 
        ${data.size || null},
        ${data.price}, 
        ${data.description || null}, 
        ${data.isActive}
      )
      RETURNING *
    `

    console.log("[v0] Product created:", result[0])
    return NextResponse.json({ success: true, product: result[0] })
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
