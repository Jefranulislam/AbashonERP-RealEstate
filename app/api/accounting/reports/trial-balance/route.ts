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
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      )
    }

    console.log("[Trial Balance] Params:", { projectId, fromDate, toDate })

    // Query to calculate trial balance
    // Debit vouchers increase debit side, Credit vouchers increase credit side
    let query

    if (projectId) {
      query = sql`
        WITH account_transactions AS (
          SELECT 
            ieh.id as account_id,
            ieh.head_name as account_name,
            ieh.account_code,
            CASE 
              WHEN v.voucher_type = 'Debit' THEN v.amount
              ELSE 0
            END as debit_amount,
            CASE 
              WHEN v.voucher_type = 'Credit' THEN v.amount
              ELSE 0
            END as credit_amount
          FROM vouchers v
          INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
          WHERE v.date >= ${fromDate}
            AND v.date <= ${toDate}
            AND v.project_id = ${projectId}
            AND v.is_confirmed = true
        )
        SELECT 
          account_id,
          account_name,
          account_code,
          SUM(debit_amount) as debit,
          SUM(credit_amount) as credit
        FROM account_transactions
        GROUP BY account_id, account_name, account_code
        HAVING SUM(debit_amount) > 0 OR SUM(credit_amount) > 0
        ORDER BY account_code, account_name
      `
    } else {
      query = sql`
        WITH account_transactions AS (
          SELECT 
            ieh.id as account_id,
            ieh.head_name as account_name,
            ieh.account_code,
            CASE 
              WHEN v.voucher_type = 'Debit' THEN v.amount
              ELSE 0
            END as debit_amount,
            CASE 
              WHEN v.voucher_type = 'Credit' THEN v.amount
              ELSE 0
            END as credit_amount
          FROM vouchers v
          INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
          WHERE v.date >= ${fromDate}
            AND v.date <= ${toDate}
            AND v.is_confirmed = true
        )
        SELECT 
          account_id,
          account_name,
          account_code,
          SUM(debit_amount) as debit,
          SUM(credit_amount) as credit
        FROM account_transactions
        GROUP BY account_id, account_name, account_code
        HAVING SUM(debit_amount) > 0 OR SUM(credit_amount) > 0
        ORDER BY account_code, account_name
      `
    }

    const accounts = await query

    // Calculate totals
    const totalDebit = accounts.reduce(
      (sum, acc) => sum + Number(acc.debit || 0),
      0
    )
    const totalCredit = accounts.reduce(
      (sum, acc) => sum + Number(acc.credit || 0),
      0
    )

    // Format the response
    const formattedAccounts = accounts.map((acc) => ({
      code: acc.account_code || "",
      name: acc.account_name,
      debit: Number(acc.debit || 0),
      credit: Number(acc.credit || 0),
    }))

    console.log(
      `[Trial Balance] Found ${formattedAccounts.length} accounts. Total Dr: ${totalDebit}, Total Cr: ${totalCredit}`
    )

    return NextResponse.json({
      accounts: formattedAccounts,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    })
  } catch (error) {
    console.error("[Trial Balance] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
