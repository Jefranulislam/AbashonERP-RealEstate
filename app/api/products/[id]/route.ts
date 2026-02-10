import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: idString } = await params
    const data = await request.json()
    const id = Number.parseInt(idString)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Safely parse numeric values
    const projectId = data.projectId ? Number.parseInt(data.projectId) : null
    const size = data.size && !isNaN(Number.parseFloat(data.size)) ? Number.parseFloat(data.size) : null
    const ratePerSqft = data.ratePerSqft && !isNaN(Number.parseFloat(data.ratePerSqft)) ? Number.parseFloat(data.ratePerSqft) : null
    const utilityCharge = data.utilityCharge && !isNaN(Number.parseFloat(data.utilityCharge)) ? Number.parseFloat(data.utilityCharge) : 0
    const price = data.price && !isNaN(Number.parseFloat(data.price)) ? Number.parseFloat(data.price) : null

    const result = await sql`
      UPDATE products SET
        project_id = ${projectId},
        product_name = ${data.productName},
        product_type = ${data.productType || null},
        size = ${size},
        rate_per_sqft = ${ratePerSqft},
        utility_charge = ${utilityCharge},
        price = ${price},
        base_price = ${price},
        description = ${data.description || null},
        is_active = ${data.isActive !== false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, product: result[0] })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: idString } = await params
    const id = Number.parseInt(idString)

    await sql`DELETE FROM products WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
