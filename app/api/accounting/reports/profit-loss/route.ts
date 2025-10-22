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

    console.log("[Profit & Loss] Params:", { projectId, fromDate, toDate })

    // Query for income (Credit vouchers)
    let incomeQuery
    if (projectId) {
      incomeQuery = sql`
        SELECT 
          ieh.head_name as name,
          ieh.account_code as code,
          ieh.head_type as category,
          SUM(v.amount) as amount
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.voucher_type = 'Credit'
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
          AND v.project_id = ${projectId}
          AND v.is_confirmed = true
        GROUP BY ieh.id, ieh.head_name, ieh.account_code, ieh.head_type
        ORDER BY ieh.head_type, ieh.head_name
      `
    } else {
      incomeQuery = sql`
        SELECT 
          ieh.head_name as name,
          ieh.account_code as code,
          ieh.head_type as category,
          SUM(v.amount) as amount
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.voucher_type = 'Credit'
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
          AND v.is_confirmed = true
        GROUP BY ieh.id, ieh.head_name, ieh.account_code, ieh.head_type
        ORDER BY ieh.head_type, ieh.head_name
      `
    }

    // Query for expenses (Debit vouchers)
    let expenseQuery
    if (projectId) {
      expenseQuery = sql`
        SELECT 
          ieh.head_name as name,
          ieh.account_code as code,
          ieh.head_type as category,
          SUM(v.amount) as amount
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.voucher_type = 'Debit'
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
          AND v.project_id = ${projectId}
          AND v.is_confirmed = true
        GROUP BY ieh.id, ieh.head_name, ieh.account_code, ieh.head_type
        ORDER BY ieh.head_type, ieh.head_name
      `
    } else {
      expenseQuery = sql`
        SELECT 
          ieh.head_name as name,
          ieh.account_code as code,
          ieh.head_type as category,
          SUM(v.amount) as amount
        FROM vouchers v
        INNER JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
        WHERE v.voucher_type = 'Debit'
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
          AND v.is_confirmed = true
        GROUP BY ieh.id, ieh.head_name, ieh.account_code, ieh.head_type
        ORDER BY ieh.head_type, ieh.head_name
      `
    }

    const [incomeResults, expenseResults] = await Promise.all([
      incomeQuery,
      expenseQuery,
    ])

    // Group income by category
    const incomeByCategory: Record<string, any[]> = {}
    let totalIncome = 0

    incomeResults.forEach((item: any) => {
      const category = item.category || "Other Income"
      if (!incomeByCategory[category]) {
        incomeByCategory[category] = []
      }
      const amount = Number(item.amount || 0)
      incomeByCategory[category].push({
        name: item.name,
        code: item.code,
        amount,
      })
      totalIncome += amount
    })

    // Group expenses by category
    const expensesByCategory: Record<string, any[]> = {}
    let totalExpenses = 0

    expenseResults.forEach((item: any) => {
      const category = item.category || "Other Expenses"
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = []
      }
      const amount = Number(item.amount || 0)
      expensesByCategory[category].push({
        name: item.name,
        code: item.code,
        amount,
      })
      totalExpenses += amount
    })

    // Format for response
    const income = Object.keys(incomeByCategory).map((category) => ({
      category,
      items: incomeByCategory[category],
    }))

    const expenses = Object.keys(expensesByCategory).map((category) => ({
      category,
      items: expensesByCategory[category],
    }))

    const netProfit = totalIncome - totalExpenses
    const profitMargin =
      totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : "0.00"

    console.log(
      `[Profit & Loss] Income: ${totalIncome}, Expenses: ${totalExpenses}, Net: ${netProfit}`
    )

    return NextResponse.json({
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: parseFloat(profitMargin),
    })
  } catch (error) {
    console.error("[Profit & Loss] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
