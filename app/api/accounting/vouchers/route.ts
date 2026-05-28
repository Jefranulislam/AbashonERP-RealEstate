import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo, normalizeVoucherType } from "@/lib/voucher-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    const voucherType = searchParams.get("voucherType")
    const normalizedVoucherType = voucherType ? normalizeVoucherType(voucherType) : null

    console.log("[v0] Fetching vouchers with projectId:", projectId, "voucherType:", voucherType)

    let vouchers

    if (projectId && voucherType && normalizedVoucherType) {
      vouchers = await sql`
        SELECT 
          v.*,
          CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END as voucher_type,
          p.project_name,
          p.address as project_address,
          ieh.head_name as expense_head_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.project_id = ${projectId}
          AND CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END = ${normalizedVoucherType}
        ORDER BY v.date DESC, v.created_at DESC
      `
    } else if (projectId) {
      vouchers = await sql`
        SELECT 
          v.*,
          CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END as voucher_type,
          p.project_name,
          p.address as project_address,
          ieh.head_name as expense_head_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.project_id = ${projectId}
        ORDER BY v.date DESC, v.created_at DESC
      `
    } else if (voucherType && normalizedVoucherType) {
      vouchers = await sql`
        SELECT 
          v.*,
          CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END as voucher_type,
          p.project_name,
          p.address as project_address,
          ieh.head_name as expense_head_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE CASE
          WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE v.voucher_type
        END = ${normalizedVoucherType}
        ORDER BY v.date DESC, v.created_at DESC
      `
    } else {
      vouchers = await sql`
        SELECT 
          v.*,
          CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END as voucher_type,
          p.project_name,
          p.address as project_address,
          ieh.head_name as expense_head_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        ORDER BY v.date DESC, v.created_at DESC
      `
    }

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

    const normalizedType = normalizeVoucherType(data.voucherType)
    if (!normalizedType) {
      return NextResponse.json({ error: "Invalid voucher type" }, { status: 400 })
    }

    // Generate voucher number
    const voucherResult = await sql`
      SELECT COUNT(*) as count
      FROM vouchers
      WHERE CASE
        WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
        WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
        WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
        WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
        ELSE voucher_type
      END = ${normalizedType}
    `
    const count = Number(voucherResult[0].count) + 1
    const voucherNo = buildVoucherNo(normalizedType, count)

    // Handle Contra vouchers differently (they have dr_bank_cash_id and cr_bank_cash_id)
    if (normalizedType === "Contra") {
      const result = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, dr_bank_cash_id, cr_bank_cash_id,
          date, amount, description, cheque_number, is_confirmed
        ) VALUES (
          ${voucherNo}, ${normalizedType}, ${data.projectId}, ${data.drBankCashId},
          ${data.crBankCashId}, ${data.date}, ${data.amount}, ${data.description},
          ${data.chequeNumber}, ${data.isConfirmed}
        )
        RETURNING *
      `
      
      return NextResponse.json({ success: true, voucher: result[0] })
    }

    // Journal voucher: create header and two detail lines (Dr and Cr)
    if (normalizedType === "Journal") {
      const drProjectId = Number(data.drProjectId)
      const crProjectId = Number(data.crProjectId)
      const drExpenseHeadId = Number(data.drExpenseHeadId)
      const crExpenseHeadId = Number(data.crExpenseHeadId)
      const drAmount = Number(data.drAmount)
      const crAmount = Number(data.crAmount)

      if (!drProjectId || !crProjectId || !drExpenseHeadId || !crExpenseHeadId) {
        return NextResponse.json({ error: "Journal debit/credit accounts are required" }, { status: 400 })
      }

      if (!Number.isFinite(drAmount) || !Number.isFinite(crAmount) || drAmount <= 0 || crAmount <= 0) {
        return NextResponse.json({ error: "Journal debit/credit amounts must be greater than zero" }, { status: 400 })
      }

      if (Math.abs(drAmount - crAmount) > 0.0001) {
        return NextResponse.json({ error: "Debit and credit amounts must be equal" }, { status: 400 })
      }

      const headerProjectId = drProjectId || crProjectId
      const journalAmount = drAmount

      const voucherInsert = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, bill_no,
          date, amount, particulars, is_confirmed
        ) VALUES (
          ${voucherNo}, ${normalizedType}, ${headerProjectId}, ${data.billNo || null},
          ${data.date}, ${journalAmount}, ${data.description || data.particulars || null}, ${data.isConfirmed}
        )
        RETURNING *
      `

      const voucher = voucherInsert[0]

      await sql`
        INSERT INTO journal_voucher_details (
          voucher_id, project_id, expense_head_id, debit_amount, credit_amount
        ) VALUES
          (${voucher.id}, ${drProjectId}, ${drExpenseHeadId}, ${drAmount}, 0),
          (${voucher.id}, ${crProjectId}, ${crExpenseHeadId}, 0, ${crAmount})
      `

      return NextResponse.json({ success: true, voucher })
    }

    // Regular vouchers (Credit, Debit, Journal)
    const result = await sql`
      INSERT INTO vouchers (
        voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
        bill_no, date, amount, particulars, cheque_number, is_confirmed,
        vendor_name, qty, rate, inventory, memo, account_head_type
      ) VALUES (
        ${voucherNo}, ${normalizedType}, ${data.projectId}, ${data.expenseHeadId},
        ${data.bankCashId}, ${data.billNo}, ${data.date}, ${data.amount},
        ${data.particulars}, ${data.chequeNumber}, ${data.isConfirmed},
        ${data.vendorName || null}, ${data.qty || null}, ${data.rate || null},
        ${data.inventory || null}, ${data.memo || null}, ${data.accountHeadType || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, voucher: result[0] })
  } catch (error) {
    console.error("[v0] Error creating voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
