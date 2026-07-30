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

    console.log("Fetching products with projectId:", projectId)

    let products

    if (projectId) {
      products = await sql`
        SELECT 
          p.*,
          pr.project_name
        FROM products p
        LEFT JOIN projects pr ON p.project_id = pr.id
        WHERE p.is_active = true
          AND p.project_id = ${projectId}
        ORDER BY p.created_at DESC
      `
    } else {
      products = await sql`
        SELECT 
          p.*,
          pr.project_name
        FROM products p
        LEFT JOIN projects pr ON p.project_id = pr.id
        WHERE p.is_active = true
        ORDER BY p.created_at DESC
      `
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
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
    console.log("Received product data:", data)

    const result = await sql`
      INSERT INTO products (
        project_id, product_name, product_type, size, rate_per_sqft, utility_charge, price, base_price, description, is_active
      ) VALUES (
        ${data.projectId ? Number.parseInt(data.projectId) : null}, 
        ${data.productName}, 
        ${data.productType || null},
        ${data.size ? Number.parseFloat(data.size) : null},
        ${data.ratePerSqft ? Number.parseFloat(data.ratePerSqft) : null},
        ${data.utilityCharge ? Number.parseFloat(data.utilityCharge) : 0},
        ${data.price ? Number.parseFloat(data.price) : null},
        ${data.price ? Number.parseFloat(data.price) : null},
        ${data.description || null}, 
        ${data.isActive !== false}
      )
      RETURNING *
    `

    console.log("Product created:", result[0])
    return NextResponse.json({ success: true, product: result[0] })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
