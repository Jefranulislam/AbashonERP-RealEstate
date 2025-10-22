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
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const projectId = searchParams.get("projectId")

    console.log("[Cash Book] Generating cash book for:", { fromDate, toDate, projectId })

    // Get opening balance (transactions before fromDate)
    let openingBalance = 0
    if (fromDate) {
      const openingQuery = await sql`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN v.voucher_type = 'Credit' THEN v.amount
            WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Bank to Cash' THEN v.amount
            ELSE 0
          END), 0) as cash_in,
          COALESCE(SUM(CASE 
            WHEN v.voucher_type = 'Debit' THEN v.amount
            WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Cash to Bank' THEN v.amount
            ELSE 0
          END), 0) as cash_out
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.is_confirmed = true
          AND v.date < ${fromDate}
          AND (
            ieh.head_name ILIKE '%cash%'
            OR v.voucher_type = 'Contra'
          )
          ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
      `
      openingBalance = Number(openingQuery[0].cash_in) - Number(openingQuery[0].cash_out)
    }

    // Get cash transactions for the period
    const cashTransactions = await sql`
      SELECT 
        v.id,
        v.date as transaction_date,
        v.voucher_type,
        v.amount,
        v.remarks,
        v.contra_type,
        ieh.head_name,
        ieh.account_code,
        p.project_name,
        CASE 
          WHEN v.voucher_type = 'Credit' THEN v.amount
          WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Bank to Cash' THEN v.amount
          ELSE 0
        END as cash_in,
        CASE 
          WHEN v.voucher_type = 'Debit' THEN v.amount
          WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Cash to Bank' THEN v.amount
          ELSE 0
        END as cash_out
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.is_confirmed = true
        AND (
          ieh.head_name ILIKE '%cash%'
          OR v.voucher_type = 'Contra'
        )
        ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
      ORDER BY v.date ASC, v.id ASC
    `

    // Calculate running balance
    let runningBalance = openingBalance
    const transactions = cashTransactions.map((txn) => {
      const cashIn = Number(txn.cash_in)
      const cashOut = Number(txn.cash_out)
      runningBalance += cashIn - cashOut

      return {
        id: txn.id,
        date: txn.transaction_date,
        voucherType: txn.voucher_type,
        contraType: txn.contra_type,
        particulars: txn.head_name,
        accountCode: txn.account_code,
        projectName: txn.project_name,
        remarks: txn.remarks,
        cashIn,
        cashOut,
        balance: runningBalance,
      }
    })

    const totalCashIn = transactions.reduce((sum, txn) => sum + txn.cashIn, 0)
    const totalCashOut = transactions.reduce((sum, txn) => sum + txn.cashOut, 0)
    const closingBalance = openingBalance + totalCashIn - totalCashOut

    // Get period summary
    const periodSummary = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE v.voucher_type = 'Credit') as receipts_count,
        COUNT(*) FILTER (WHERE v.voucher_type = 'Debit') as payments_count,
        COUNT(*) FILTER (WHERE v.voucher_type = 'Contra') as contra_count,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Credit' THEN v.amount ELSE 0 END), 0) as total_receipts,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Debit' THEN v.amount ELSE 0 END), 0) as total_payments
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      WHERE v.is_confirmed = true
        AND ieh.head_name ILIKE '%cash%'
        ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
    `

    const response = {
      summary: {
        openingBalance,
        totalCashIn,
        totalCashOut,
        closingBalance,
        receiptsCount: Number(periodSummary[0].receipts_count),
        paymentsCount: Number(periodSummary[0].payments_count),
        contraCount: Number(periodSummary[0].contra_count),
        totalReceipts: Number(periodSummary[0].total_receipts),
        totalPayments: Number(periodSummary[0].total_payments),
      },
      transactions,
      filters: {
        fromDate,
        toDate,
        projectId,
      },
    }

    console.log("[Cash Book] Cash book generated successfully:", transactions.length, "transactions")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Cash Book] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
