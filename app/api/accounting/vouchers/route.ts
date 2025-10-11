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
    const voucherType = searchParams.get("voucherType")

    let query = `
      SELECT 
        v.*,
        p.project_name,
        ieh.head_name as expense_head_name,
        bc.account_title as bank_cash_name
      FROM vouchers v
      LEFT JOIN projects p ON v.project_id = p.id
      LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
      WHERE 1=1
    `

    const params: any[] = []

    if (projectId) {
      query += ` AND v.project_id = $${params.length + 1}`
      params.push(projectId)
    }

    if (voucherType) {
      query += ` AND v.voucher_type = $${params.length + 1}`
      params.push(voucherType)
    }

    query += ` ORDER BY v.date DESC, v.created_at DESC`

    const vouchers = await sql(query, params)

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error("[v0] Error fetching vouchers:", error)
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

    // Generate voucher number
    const voucherResult = await sql`
      SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = ${data.voucherType}
    `
    const count = Number(voucherResult[0].count) + 1
    const prefix =
      data.voucherType === "Credit"
        ? "CR"
        : data.voucherType === "Debit"
          ? "DR"
          : data.voucherType === "Journal"
            ? "JV"
            : "CV"
    const voucherNo = `${prefix}${String(count).padStart(6, "0")}`

    const result = await sql`
      INSERT INTO vouchers (
        voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
        bill_no, date, amount, particulars, cheque_number, is_confirmed
      ) VALUES (
        ${voucherNo}, ${data.voucherType}, ${data.projectId}, ${data.expenseHeadId},
        ${data.bankCashId}, ${data.billNo}, ${data.date}, ${data.amount},
        ${data.particulars}, ${data.chequeNumber}, ${data.isConfirmed}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, voucher: result[0] })
  } catch (error) {
    console.error("[v0] Error creating voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
