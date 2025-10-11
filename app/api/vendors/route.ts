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
    const search = searchParams.get("search")

    let query = `
      SELECT * FROM vendors
      WHERE is_active = true
    `

    const params: any[] = []

    if (search) {
      query += ` AND (vendor_name ILIKE $${params.length + 1} OR phone ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC`

    const vendors = await sql(query, params)

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error("[v0] Error fetching vendors:", error)
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

    const result = await sql`
      INSERT INTO vendors (
        vendor_name, mailing_address, website, phone, email, description, is_active
      ) VALUES (
        ${data.vendorName}, ${data.mailingAddress}, ${data.website}, 
        ${data.phone}, ${data.email}, ${data.description}, ${data.isActive}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, vendor: result[0] })
  } catch (error) {
    console.error("[v0] Error creating vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
