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
    const expenseHeadId = searchParams.get("expenseHeadId")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const ledgerType = searchParams.get("type") || "all" // 'all' or 'project-wise'

    console.log("[Ledger Reports] Generating ledger for:", { 
      projectId, 
      expenseHeadId, 
      fromDate, 
      toDate,
      ledgerType 
    })

    if (ledgerType === "project-wise" && !projectId) {
      return NextResponse.json(
        { error: "Project ID is required for project-wise ledger" },
        { status: 400 }
      )
    }

    // Build ledger query with voucher transactions
    const ledgerQuery = sql`
      SELECT 
        v.id as voucher_id,
        v.voucher_type,
        v.date as transaction_date,
        v.amount,
        v.remarks,
        v.is_confirmed,
        ieh.id as expense_head_id,
        ieh.head_name,
        ieh.account_code,
        ieh.type as head_type,
        p.project_name,
        p.id as project_id,
        CASE 
          WHEN v.voucher_type = 'Debit' THEN v.amount
          WHEN v.voucher_type = 'Journal' AND v.type = 'Dr' THEN v.amount
          ELSE 0
        END as debit_amount,
        CASE 
          WHEN v.voucher_type = 'Credit' THEN v.amount
          WHEN v.voucher_type = 'Journal' AND v.type = 'Cr' THEN v.amount
          WHEN v.voucher_type = 'Contra' THEN v.amount
          ELSE 0
        END as credit_amount
      FROM vouchers v
      INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.is_confirmed = true
        ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
        ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
        ${expenseHeadId ? sql`AND v.expense_head_id = ${expenseHeadId}` : sql``}
      ORDER BY v.date ASC, v.id ASC
    `

    const transactions = await ledgerQuery

    // Group transactions by expense head
    const ledgerByExpenseHead: Record<string, any> = {}

    for (const txn of transactions) {
      const key = txn.expense_head_id
      
      if (!ledgerByExpenseHead[key]) {
        ledgerByExpenseHead[key] = {
          expenseHeadId: txn.expense_head_id,
          headName: txn.head_name,
          accountCode: txn.account_code,
          headType: txn.head_type,
          projectName: txn.project_name,
          projectId: txn.project_id,
          openingBalance: 0,
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: 0,
        }
      }

      ledgerByExpenseHead[key].transactions.push({
        voucherId: txn.voucher_id,
        date: txn.transaction_date,
        voucherType: txn.voucher_type,
        remarks: txn.remarks,
        debit: Number(txn.debit_amount),
        credit: Number(txn.credit_amount),
        balance: 0, // Will calculate running balance below
      })

      ledgerByExpenseHead[key].totalDebit += Number(txn.debit_amount)
      ledgerByExpenseHead[key].totalCredit += Number(txn.credit_amount)
    }

    // Calculate running balances
    for (const key in ledgerByExpenseHead) {
      const ledger = ledgerByExpenseHead[key]
      let runningBalance = ledger.openingBalance

      for (const txn of ledger.transactions) {
        runningBalance += txn.debit - txn.credit
        txn.balance = runningBalance
      }

      ledger.closingBalance = runningBalance
    }

    const ledgerArray = Object.values(ledgerByExpenseHead)

    // Summary statistics
    const summary = {
      totalAccounts: ledgerArray.length,
      totalDebit: ledgerArray.reduce((sum, l) => sum + l.totalDebit, 0),
      totalCredit: ledgerArray.reduce((sum, l) => sum + l.totalCredit, 0),
      netBalance: ledgerArray.reduce((sum, l) => sum + l.closingBalance, 0),
      totalTransactions: transactions.length,
    }

    // If project-wise, also get project summary
    let projectSummary = null
    if (projectId) {
      const projectData = await sql`
        SELECT 
          p.project_name,
          pl.location_name,
          COUNT(DISTINCT v.id) as transaction_count,
          SUM(CASE WHEN v.voucher_type = 'Debit' THEN v.amount ELSE 0 END) as total_expenses,
          SUM(CASE WHEN v.voucher_type = 'Credit' THEN v.amount ELSE 0 END) as total_income
        FROM projects p
        LEFT JOIN project_locations pl ON p.project_location_id = pl.id
        LEFT JOIN vouchers v ON p.id = v.project_id AND v.is_confirmed = true
        WHERE p.id = ${projectId}
          ${fromDate ? sql`AND v.date >= ${fromDate}` : sql``}
          ${toDate ? sql`AND v.date <= ${toDate}` : sql``}
        GROUP BY p.id, p.project_name, pl.location_name
      `

      if (projectData.length > 0) {
        projectSummary = {
          projectName: projectData[0].project_name,
          locationName: projectData[0].location_name,
          transactionCount: Number(projectData[0].transaction_count),
          totalExpenses: Number(projectData[0].total_expenses),
          totalIncome: Number(projectData[0].total_income),
          netResult: Number(projectData[0].total_income) - Number(projectData[0].total_expenses),
        }
      }
    }

    const response = {
      summary,
      projectSummary,
      ledger: ledgerArray,
      filters: {
        projectId,
        expenseHeadId,
        fromDate,
        toDate,
        ledgerType,
      },
    }

    console.log("[Ledger Reports] Ledger generated successfully:", ledgerArray.length, "accounts")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Ledger Reports] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
