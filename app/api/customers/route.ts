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
      SELECT * FROM customers
      WHERE is_active = true
    `

    const params: any[] = []

    if (search) {
      query += ` AND (customer_name ILIKE $${params.length + 1} OR phone ILIKE $${params.length + 1} OR customer_id ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC`

    console.log("[v0] Fetching customers with query:", query)
    const customers = await sql(query, params)
    console.log("[v0] Customers fetched:", customers.length)

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("[v0] Error fetching customers:", error)
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
    console.log("[v0] Creating customer with data:", data)

    // Generate Customer ID
    const customerIdResult = await sql`SELECT COUNT(*) as count FROM customers`
    const count = Number(customerIdResult[0].count) + 1
    const customerId = `CUST${String(count).padStart(6, "0")}`

    const result = await sql`
      INSERT INTO customers (
        customer_id, profession, customer_name, father_or_husband_name,
        phone, whatsapp, nid, email, mailing_address, permanent_address,
        birth_date, crm_id, assign_to_name, image_url, is_active
      ) VALUES (
        ${customerId}, 
        ${data.profession || null}, 
        ${data.customerName}, 
        ${data.fatherOrHusbandName || null}, 
        ${data.phone}, 
        ${data.whatsapp || null},
        ${data.nid || null}, 
        ${data.email || null}, 
        ${data.mailingAddress || null}, 
        ${data.permanentAddress || null}, 
        ${data.birthDate || null}, 
        ${data.crmId || null},
        ${data.assignToName || null}, 
        ${data.imageUrl || null}, 
        ${data.isActive !== false}
      )
      RETURNING *
    `

    console.log("[v0] Customer created:", result[0])
    return NextResponse.json({ success: true, customer: result[0] })
  } catch (error) {
    console.error("[v0] Error creating customer:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
