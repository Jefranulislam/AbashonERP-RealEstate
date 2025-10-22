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

    console.log("[v0] Fetching constructors with search:", search)

    let constructors

    if (search) {
      constructors = await sql`
        SELECT * FROM constructors
        WHERE is_active = true
          AND (constructor_name ILIKE ${'%' + search + '%'} OR phone ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
      `
    } else {
      constructors = await sql`
        SELECT * FROM constructors
        WHERE is_active = true
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ constructors })
  } catch (error) {
    console.error("[v0] Error fetching constructors:", error)
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
    console.log("[v0] Creating constructor:", data)

    const result = await sql`
      INSERT INTO constructors (
        constructor_name, mailing_address, phone, email, description, is_active
      ) VALUES (
        ${data.constructorName}, 
        ${data.mailingAddress || null}, 
        ${data.phone || null}, 
        ${data.email || null}, 
        ${data.description || null}, 
        ${data.isActive !== false}
      )
      RETURNING *
    `

    console.log("[v0] Constructor created:", result[0])
    return NextResponse.json({ success: true, constructor: result[0] })
  } catch (error) {
    console.error("[v0] Error creating constructor:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
