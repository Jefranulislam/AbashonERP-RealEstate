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

    let requisitions

    if (search) {
      requisitions = await sql`
        SELECT 
          pr.*,
          p.project_name,
          e.name as employee_name
        FROM purchase_requisitions pr
        LEFT JOIN projects p ON pr.project_id = p.id
        LEFT JOIN employees e ON pr.employee_id = e.id
        WHERE pr.mpr_no ILIKE ${`%${search}%`} 
           OR p.project_name ILIKE ${`%${search}%`}
        ORDER BY pr.created_at DESC
      `
    } else {
      requisitions = await sql`
        SELECT 
          pr.*,
          p.project_name,
          e.name as employee_name
        FROM purchase_requisitions pr
        LEFT JOIN projects p ON pr.project_id = p.id
        LEFT JOIN employees e ON pr.employee_id = e.id
        ORDER BY pr.created_at DESC
      `
    }

    return NextResponse.json({ requisitions })
  } catch (error) {
    console.error("[v0] Error fetching requisitions:", error)
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
    console.log("[API] Received requisition data:", data)

    // Validate required fields
    if (!data.projectId || !data.employeeId) {
      return NextResponse.json({ error: "Project and Employee are required" }, { status: 400 })
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    // Generate MPR NO
    const mprResult = await sql`SELECT COUNT(*) as count FROM purchase_requisitions`
    const count = Number(mprResult[0].count) + 1
    const mprNo = `MPR${String(count).padStart(6, "0")}`

    // Calculate total amount
    const totalAmount = data.items.reduce((sum: number, item: any) => sum + Number(item.totalPrice || 0), 0)

    console.log("[API] Inserting requisition:", { mprNo, totalAmount })

    // Insert requisition
    const result = await sql`
      INSERT INTO purchase_requisitions (
        mpr_no, project_id, employee_id, purpose_description, requisition_date,
        required_date, comments, contact_person, nb, remark, total_amount, is_confirmed
      ) VALUES (
        ${mprNo}, 
        ${data.projectId}, 
        ${data.employeeId}, 
        ${data.purposeDescription || null},
        ${data.requisitionDate}, 
        ${data.requiredDate || null}, 
        ${data.comments || null},
        ${data.contactPerson || null}, 
        ${data.nb || null}, 
        ${data.remark || null}, 
        ${totalAmount}, 
        false
      )
      RETURNING *
    `

    const requisitionId = result[0].id
    console.log("[API] Created requisition ID:", requisitionId)

    // Insert items
    for (const item of data.items) {
      if (!item.expenseHeadId || !item.qty || !item.rate) {
        console.warn("[API] Skipping invalid item:", item)
        continue
      }

      await sql`
        INSERT INTO purchase_requisition_items (
          requisition_id, expense_head_id, description, qty, rate, total_price
        ) VALUES (
          ${requisitionId}, 
          ${item.expenseHeadId}, 
          ${item.description || null},
          ${item.qty}, 
          ${item.rate}, 
          ${item.totalPrice || (Number(item.qty) * Number(item.rate))}
        )
      `
    }

    console.log("[API] Requisition created successfully")
    return NextResponse.json({ success: true, requisition: result[0] })
  } catch (error: any) {
    console.error("[v0] Error creating requisition:", error)
    console.error("[v0] Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
