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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"

    let query
    if (search && status !== "all") {
      query = sql`
        SELECT ch.*, cu.customer_name 
        FROM cheques ch 
        LEFT JOIN customers cu ON ch.customer_id = cu.id 
        WHERE (
          ch.cheque_number ILIKE ${`%${search}%`} 
          OR cu.customer_name ILIKE ${`%${search}%`}
          OR ch.bank_name ILIKE ${`%${search}%`}
        )
        AND ch.status = ${status}
        ORDER BY ch.created_at DESC
      `
    } else if (search) {
      query = sql`
        SELECT ch.*, cu.customer_name 
        FROM cheques ch 
        LEFT JOIN customers cu ON ch.customer_id = cu.id 
        WHERE ch.cheque_number ILIKE ${`%${search}%`} 
          OR cu.customer_name ILIKE ${`%${search}%`}
          OR ch.bank_name ILIKE ${`%${search}%`}
        ORDER BY ch.created_at DESC
      `
    } else if (status !== "all") {
      query = sql`
        SELECT ch.*, cu.customer_name 
        FROM cheques ch 
        LEFT JOIN customers cu ON ch.customer_id = cu.id 
        WHERE ch.status = ${status}
        ORDER BY ch.created_at DESC
      `
    } else {
      query = sql`
        SELECT ch.*, cu.customer_name 
        FROM cheques ch 
        LEFT JOIN customers cu ON ch.customer_id = cu.id 
        ORDER BY ch.created_at DESC
      `
    }

    const res = await query
    return NextResponse.json({ cheques: res })
  } catch (error) {
    console.error("[v0] Error fetching cheques:", error)
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
    if (!data.chequeNumber || !data.chequeAmount || !data.chequeDate) {
      return NextResponse.json(
        { error: "Cheque number, amount, and date are required" },
        { status: 400 }
      )
    }

    const res = await sql`
      INSERT INTO cheques (
        customer_id, 
        bank_name, 
        branch_name,
        cheque_number, 
        cheque_amount, 
        cheque_date, 
        received_date,
        submitted_date, 
        is_submitted,
        status,
        remarks,
        cleared_date
      )
      VALUES (
        ${data.customerId || null}, 
        ${data.bankName || null}, 
        ${data.branchName || null},
        ${data.chequeNumber}, 
        ${data.chequeAmount}, 
        ${data.chequeDate}, 
        ${data.receivedDate || null},
        ${data.submittedDate || null}, 
        ${data.isSubmitted || false},
        ${data.status || 'Pending'},
        ${data.remarks || null},
        ${data.clearedDate || null}
      )
      RETURNING *
    `

    return NextResponse.json({ 
      success: true,
      cheque: res[0] 
    })
  } catch (error) {
    console.error("[v0] Error creating cheque:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
