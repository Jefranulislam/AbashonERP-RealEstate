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
    const status = searchParams.get("status")
    const paymentType = searchParams.get("paymentType")

    let query
    const conditions = ["ap.is_active = true"]
    const params: any[] = []

    if (projectId && projectId !== "all") {
      conditions.push(`ap.project_id = ${projectId}`)
    }

    if (status && status !== "all") {
      conditions.push(`ap.status = '${status}'`)
    }

    if (paymentType && paymentType !== "all") {
      conditions.push(`ap.payment_type = '${paymentType}'`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    query = await sql`
      SELECT 
        ap.*, 
        p.project_name, 
        v.vendor_name, 
        c.constructor_name
      FROM advance_payables ap
      LEFT JOIN projects p ON ap.project_id = p.id
      LEFT JOIN vendors v ON ap.vendor_id = v.id
      LEFT JOIN constructors c ON ap.constructor_id = c.id
      WHERE ap.is_active = true
      ORDER BY ap.payment_date DESC, ap.created_at DESC
    `

    // Filter in JavaScript if needed
    let filteredResults = query
    if (projectId && projectId !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.project_id === parseInt(projectId))
    }
    if (status && status !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.status === status)
    }
    if (paymentType && paymentType !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.payment_type === paymentType)
    }

    return NextResponse.json({ advancePayables: filteredResults })
  } catch (error) {
    console.error("[v0] Error fetching advance payables:", error)
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

    // Validate required fields
    if (!data.projectId || !data.amount || !data.paymentDate) {
      return NextResponse.json(
        { error: "Project, amount, and payment date are required" },
        { status: 400 }
      )
    }

    // Validate that either vendor or constructor is selected
    if (!data.vendorId && !data.constructorId) {
      return NextResponse.json(
        { error: "Either vendor or constructor must be selected" },
        { status: 400 }
      )
    }

    const res = await sql`
      INSERT INTO advance_payables (
        project_id, 
        vendor_id, 
        constructor_id, 
        amount, 
        payment_date, 
        payment_type,
        payment_method,
        reference_number,
        description,
        status,
        is_active
      )
      VALUES (
        ${data.projectId},
        ${data.vendorId || null},
        ${data.constructorId || null},
        ${data.amount},
        ${data.paymentDate},
        ${data.paymentType || 'Advance'},
        ${data.paymentMethod || null},
        ${data.referenceNumber || null},
        ${data.description || null},
        ${data.status || 'Pending'},
        ${data.isActive !== false}
      )
      RETURNING *
    `

    return NextResponse.json({ 
      success: true,
      advancePayable: res[0] 
    })
  } catch (error) {
    console.error("[v0] Error creating advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
