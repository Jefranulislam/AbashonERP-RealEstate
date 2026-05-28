import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureVendorCodeSchema, getNextVendorCode } from "@/lib/vendor-code"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureVendorCodeSchema()

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")
  const limitParam = Number(searchParams.get("limit") || 20)
  const offsetParam = Number(searchParams.get("offset") || 0)
  // enforce sensible bounds
  const limit = Math.min(Math.max(1, limitParam), 100)
  const offset = Math.max(0, offsetParam)

    console.log("[v0] Fetching vendors with search:", search)

    let vendors

    if (search) {
      vendors = await sql`
        SELECT * FROM vendors
        WHERE is_active = true
          AND (vendor_name ILIKE ${'%' + search + '%'} OR vendor_code ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      vendors = await sql`
        SELECT * FROM vendors
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ vendors }, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=15",
      },
    })
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

    await ensureVendorCodeSchema()

    const data = await request.json()
    const vendorCode = String(data.vendorCode || "").trim() || await getNextVendorCode()

    const result = await sql`
      INSERT INTO vendors (
        vendor_code, vendor_name, mailing_address, website, phone, email, description,
        bank_name, bank_account_number, bank_account_name, bank_branch, bank_routing_number, bank_swift_code,
        materials, is_active
      ) VALUES (
        ${vendorCode}, ${data.vendorName}, ${data.mailingAddress}, ${data.website}, 
        ${data.phone}, ${data.email}, ${data.description},
        ${data.bankName || null}, ${data.bankAccountNumber || null}, ${data.bankAccountName || null},
        ${data.bankBranch || null}, ${data.bankRoutingNumber || null}, ${data.bankSwiftCode || null},
        ${data.materials && data.materials.length > 0 ? data.materials : null}, 
        ${data.isActive !== false}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, vendor: result[0] })
  } catch (error) {
    console.error("[v0] Error creating vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
