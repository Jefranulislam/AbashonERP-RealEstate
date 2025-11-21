import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "edge"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const expenseHeadId = searchParams.get("expenseHeadId")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    if (!expenseHeadId) {
      return NextResponse.json({ error: "Expense head ID is required" }, { status: 400 })
    }

    console.log("[Ledger] Fetching ledger for expense head:", expenseHeadId, "from:", fromDate, "to:", toDate)

    // Get expense head details
    const expenseHead = await sql`
      SELECT * FROM income_expense_heads WHERE id = ${expenseHeadId}
    `

    if (expenseHead.length === 0) {
      return NextResponse.json({ error: "Expense head not found" }, { status: 404 })
    }

    // Calculate opening balance (transactions before fromDate)
    let openingBalance = 0
    if (fromDate) {
      const openingResult = await sql`
        SELECT 
          COALESCE(SUM(CASE WHEN voucher_type = 'Credit' THEN amount ELSE 0 END), 0) as total_credit,
          COALESCE(SUM(CASE WHEN voucher_type = 'Debit' THEN amount ELSE 0 END), 0) as total_debit
        FROM vouchers
        WHERE expense_head_id = ${expenseHeadId}
          AND date < ${fromDate}
          AND is_confirmed = true
      `
      openingBalance = Number(openingResult[0].total_credit) - Number(openingResult[0].total_debit)
    }

    // Fetch transactions based on filters
    let transactions: any[]
    
    if (fromDate && toDate) {
      transactions = await sql`
        SELECT 
          v.id,
          v.voucher_no,
          v.voucher_type,
          v.date,
          v.amount,
          v.bill_no,
          v.description,
          v.is_confirmed,
          p.project_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.expense_head_id = ${expenseHeadId}
          AND v.is_confirmed = true
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
        ORDER BY v.date ASC, v.created_at ASC
      `
    } else if (fromDate) {
      transactions = await sql`
        SELECT 
          v.id,
          v.voucher_no,
          v.voucher_type,
          v.date,
          v.amount,
          v.bill_no,
          v.description,
          v.is_confirmed,
          p.project_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.expense_head_id = ${expenseHeadId}
          AND v.is_confirmed = true
          AND v.date >= ${fromDate}
        ORDER BY v.date ASC, v.created_at ASC
      `
    } else if (toDate) {
      transactions = await sql`
        SELECT 
          v.id,
          v.voucher_no,
          v.voucher_type,
          v.date,
          v.amount,
          v.bill_no,
          v.description,
          v.is_confirmed,
          p.project_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.expense_head_id = ${expenseHeadId}
          AND v.is_confirmed = true
          AND v.date <= ${toDate}
        ORDER BY v.date ASC, v.created_at ASC
      `
    } else {
      transactions = await sql`
        SELECT 
          v.id,
          v.voucher_no,
          v.voucher_type,
          v.date,
          v.amount,
          v.bill_no,
          v.description,
          v.is_confirmed,
          p.project_name,
          bc.account_title as bank_cash_name,
          dr_bc.account_title as dr_bank_cash_name,
          cr_bc.account_title as cr_bank_cash_name
        FROM vouchers v
        LEFT JOIN projects p ON v.project_id = p.id
        LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
        LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
        LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
        WHERE v.expense_head_id = ${expenseHeadId}
          AND v.is_confirmed = true
        ORDER BY v.date ASC, v.created_at ASC
      `
    }

    // Calculate running balance for each transaction
    let runningBalance = openingBalance
    const ledgerEntries = transactions.map((transaction: any) => {
      const debit = transaction.voucher_type === 'Debit' ? Number(transaction.amount) : 0
      const credit = transaction.voucher_type === 'Credit' ? Number(transaction.amount) : 0
      
      runningBalance += credit - debit

      return {
        id: transaction.id,
        date: transaction.date,
        voucherNo: transaction.voucher_no,
        voucherType: transaction.voucher_type,
        particulars: getParticulars(transaction),
        debit,
        credit,
        balance: runningBalance,
        projectName: transaction.project_name,
        billNo: transaction.bill_no,
        description: transaction.description,
      }
    })

    // Calculate closing balance
    const closingBalance = runningBalance

    // Calculate totals
    const totalDebit = ledgerEntries.reduce((sum: number, entry: any) => sum + entry.debit, 0)
    const totalCredit = ledgerEntries.reduce((sum: number, entry: any) => sum + entry.credit, 0)

    return NextResponse.json({
      expenseHead: expenseHead[0],
      openingBalance,
      closingBalance,
      totalDebit,
      totalCredit,
      entries: ledgerEntries,
    })
  } catch (error) {
    console.error("[Ledger] Error fetching ledger:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getParticulars(transaction: any): string {
  const parts: string[] = []

  if (transaction.project_name) {
    parts.push(transaction.project_name)
  }

  if (transaction.bank_cash_name) {
    parts.push(transaction.bank_cash_name)
  } else if (transaction.dr_bank_cash_name && transaction.cr_bank_cash_name) {
    parts.push(`${transaction.dr_bank_cash_name} to ${transaction.cr_bank_cash_name}`)
  }

  if (transaction.bill_no) {
    parts.push(`Bill: ${transaction.bill_no}`)
  }

  if (transaction.description) {
    parts.push(transaction.description)
  }

  return parts.length > 0 ? parts.join(" | ") : transaction.voucher_type
}
