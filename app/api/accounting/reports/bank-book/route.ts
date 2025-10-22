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

    console.log("[Bank Book] Generating bank book for:", { fromDate, toDate, projectId })

    // Get opening balance (transactions before fromDate)
    let openingBalance = 0
    if (fromDate) {
      const openingQuery = await sql`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN v.voucher_type = 'Credit' THEN v.amount
            WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Cash to Bank' THEN v.amount
            ELSE 0
          END), 0) as bank_in,
          COALESCE(SUM(CASE 
            WHEN v.voucher_type = 'Debit' THEN v.amount
            WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Bank to Cash' THEN v.amount
            ELSE 0
          END), 0) as bank_out
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.is_confirmed = true
          AND v.date < ${fromDate}
          AND (
            ieh.head_name ILIKE '%bank%'
            OR v.voucher_type = 'Contra'
          )
          ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
      `
      openingBalance = Number(openingQuery[0].bank_in) - Number(openingQuery[0].bank_out)
    }

    // Get bank transactions for the period
    const bankTransactions = await sql`
      SELECT 
        v.id,
        v.date as transaction_date,
        v.voucher_type,
        v.amount,
        v.remarks,
        v.contra_type,
        v.cheque_no,
        v.cheque_date,
        ieh.head_name,
        ieh.account_code,
        p.project_name,
        CASE 
          WHEN v.voucher_type = 'Credit' THEN v.amount
          WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Cash to Bank' THEN v.amount
          ELSE 0
        END as bank_in,
        CASE 
          WHEN v.voucher_type = 'Debit' THEN v.amount
          WHEN v.voucher_type = 'Contra' AND v.contra_type = 'Bank to Cash' THEN v.amount
          ELSE 0
        END as bank_out
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.is_confirmed = true
        AND (
          ieh.head_name ILIKE '%bank%'
          OR v.voucher_type = 'Contra'
        )
        ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
      ORDER BY v.date ASC, v.id ASC
    `

    // Calculate running balance
    let runningBalance = openingBalance
    const transactions = bankTransactions.map((txn) => {
      const bankIn = Number(txn.bank_in)
      const bankOut = Number(txn.bank_out)
      runningBalance += bankIn - bankOut

      return {
        id: txn.id,
        date: txn.transaction_date,
        voucherType: txn.voucher_type,
        contraType: txn.contra_type,
        particulars: txn.head_name,
        accountCode: txn.account_code,
        projectName: txn.project_name,
        remarks: txn.remarks,
        chequeNo: txn.cheque_no,
        chequeDate: txn.cheque_date,
        bankIn,
        bankOut,
        balance: runningBalance,
      }
    })

    const totalBankIn = transactions.reduce((sum, txn) => sum + txn.bankIn, 0)
    const totalBankOut = transactions.reduce((sum, txn) => sum + txn.bankOut, 0)
    const closingBalance = openingBalance + totalBankIn - totalBankOut

    // Get period summary with cheque statistics
    const periodSummary = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE v.voucher_type = 'Credit') as deposits_count,
        COUNT(*) FILTER (WHERE v.voucher_type = 'Debit') as withdrawals_count,
        COUNT(*) FILTER (WHERE v.voucher_type = 'Contra') as contra_count,
        COUNT(*) FILTER (WHERE v.cheque_no IS NOT NULL) as cheque_count,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Credit' THEN v.amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Debit' THEN v.amount ELSE 0 END), 0) as total_withdrawals
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      WHERE v.is_confirmed = true
        AND ieh.head_name ILIKE '%bank%'
        ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
    `

    // Get pending cheques (if cheque_date is in future or not cleared)
    const pendingCheques = await sql`
      SELECT 
        v.id,
        v.date,
        v.cheque_no,
        v.cheque_date,
        v.amount,
        ieh.head_name
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      WHERE v.is_confirmed = true
        AND ieh.head_name ILIKE '%bank%'
        AND v.cheque_no IS NOT NULL
        AND (v.cheque_date > CURRENT_DATE OR v.cheque_status = 'Pending')
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
      ORDER BY v.cheque_date ASC
      LIMIT 10
    `

    const response = {
      summary: {
        openingBalance,
        totalBankIn,
        totalBankOut,
        closingBalance,
        depositsCount: Number(periodSummary[0].deposits_count),
        withdrawalsCount: Number(periodSummary[0].withdrawals_count),
        contraCount: Number(periodSummary[0].contra_count),
        chequeCount: Number(periodSummary[0].cheque_count),
        totalDeposits: Number(periodSummary[0].total_deposits),
        totalWithdrawals: Number(periodSummary[0].total_withdrawals),
      },
      transactions,
      pendingCheques: pendingCheques.map((cheque) => ({
        id: cheque.id,
        date: cheque.date,
        chequeNo: cheque.cheque_no,
        chequeDate: cheque.cheque_date,
        amount: Number(cheque.amount),
        particulars: cheque.head_name,
      })),
      filters: {
        fromDate,
        toDate,
        projectId,
      },
    }

    console.log("[Bank Book] Bank book generated successfully:", transactions.length, "transactions")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Bank Book] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
