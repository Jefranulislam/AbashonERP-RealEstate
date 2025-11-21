import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

interface ProfitLossItem {
  name: string
  amount: number
  accountId?: number
}

interface ProfitLossCategory {
  category: string
  items: ProfitLossItem[]
  subtotal: number
}

interface ProfitLossData {
  fromDate: string
  toDate: string
  projectId?: number
  projectName?: string
  income: ProfitLossCategory[]
  expenses: ProfitLossCategory[]
  totals: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get("fromDate") || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
    const toDate = searchParams.get("toDate") || new Date().toISOString().split("T")[0]
    const projectId = searchParams.get("projectId") ? parseInt(searchParams.get("projectId")!) : null

    // Build the WHERE clause for project filter
    const projectFilter = projectId ? sql`AND v.project_id = ${projectId}` : sql``

    // Get project name if filtered
    let projectName = null
    if (projectId) {
      const projectResult = await sql`
        SELECT project_name FROM projects WHERE id = ${projectId}
      `
      projectName = projectResult[0]?.project_name || null
    }

    // Fetch all income transactions (Credit vouchers)
    const incomeTransactions = await sql`
      SELECT 
        v.id,
        v.amount,
        v.date,
        v.voucher_type,
        ieh.id as account_id,
        ieh.head_name as account_name,
        iet.name as account_type,
        p.project_name
      FROM vouchers v
      LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.voucher_type = 'Credit'
        AND v.date >= ${fromDate}
        AND v.date <= ${toDate}
        ${projectFilter}
      ORDER BY ieh.head_name, v.date
    `

    // Fetch all expense transactions (Debit vouchers)
    const expenseTransactions = await sql`
      SELECT 
        v.id,
        v.amount,
        v.date,
        v.voucher_type,
        ieh.id as account_id,
        ieh.head_name as account_name,
        iet.name as account_type,
        p.project_name
      FROM vouchers v
      LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.voucher_type = 'Debit'
        AND v.date >= ${fromDate}
        AND v.date <= ${toDate}
        ${projectFilter}
      ORDER BY ieh.head_name, v.date
    `

    // Group income by account heads
    const incomeByAccount = new Map<string, { name: string; amount: number; accountId: number }>()
    for (const transaction of incomeTransactions) {
      const key = `${transaction.account_id}_${transaction.account_name}`
      if (!incomeByAccount.has(key)) {
        incomeByAccount.set(key, {
          name: transaction.account_name || 'Uncategorized Income',
          amount: 0,
          accountId: transaction.account_id
        })
      }
      const entry = incomeByAccount.get(key)!
      entry.amount += Number(transaction.amount)
    }

    // Group expenses by account heads
    const expensesByAccount = new Map<string, { name: string; amount: number; accountId: number }>()
    for (const transaction of expenseTransactions) {
      const key = `${transaction.account_id}_${transaction.account_name}`
      if (!expensesByAccount.has(key)) {
        expensesByAccount.set(key, {
          name: transaction.account_name || 'Uncategorized Expense',
          amount: 0,
          accountId: transaction.account_id
        })
      }
      const entry = expensesByAccount.get(key)!
      entry.amount += Number(transaction.amount)
    }

    // Categorize income (you can enhance this based on your account structure)
    const incomeCategories: ProfitLossCategory[] = []
    
    // Primary Revenue
    const primaryRevenue: ProfitLossItem[] = []
    // Service Income  
    const serviceIncome: ProfitLossItem[] = []
    // Other Income
    const otherIncome: ProfitLossItem[] = []

    for (const [, item] of incomeByAccount) {
      const name = item.name.toLowerCase()
      if (name.includes('sales') || name.includes('revenue') || name.includes('apartment') || 
          name.includes('commercial') || name.includes('parking')) {
        primaryRevenue.push(item)
      } else if (name.includes('service') || name.includes('fee') || name.includes('charge') || 
                 name.includes('registration') || name.includes('maintenance')) {
        serviceIncome.push(item)
      } else {
        otherIncome.push(item)
      }
    }

    if (primaryRevenue.length > 0) {
      const subtotal = primaryRevenue.reduce((sum, item) => sum + item.amount, 0)
      incomeCategories.push({ category: 'Primary Revenue', items: primaryRevenue, subtotal })
    }
    if (serviceIncome.length > 0) {
      const subtotal = serviceIncome.reduce((sum, item) => sum + item.amount, 0)
      incomeCategories.push({ category: 'Service Income', items: serviceIncome, subtotal })
    }
    if (otherIncome.length > 0) {
      const subtotal = otherIncome.reduce((sum, item) => sum + item.amount, 0)
      incomeCategories.push({ category: 'Other Income', items: otherIncome, subtotal })
    }

    // Categorize expenses
    const expenseCategories: ProfitLossCategory[] = []
    
    // Direct Costs
    const directCosts: ProfitLossItem[] = []
    // Operating Expenses
    const operatingExpenses: ProfitLossItem[] = []
    // Administrative Expenses
    const adminExpenses: ProfitLossItem[] = []
    // Financial Expenses
    const financialExpenses: ProfitLossItem[] = []

    for (const [, item] of expensesByAccount) {
      const name = item.name.toLowerCase()
      if (name.includes('land') || name.includes('construction') || name.includes('material') || 
          name.includes('labour') || name.includes('labor') || name.includes('contractor')) {
        directCosts.push(item)
      } else if (name.includes('marketing') || name.includes('utilities') || name.includes('transport') || 
                 name.includes('office rent') || name.includes('communication')) {
        operatingExpenses.push(item)
      } else if (name.includes('salary') || name.includes('wage') || name.includes('benefit') || 
                 name.includes('professional fee') || name.includes('legal') || name.includes('audit')) {
        adminExpenses.push(item)
      } else if (name.includes('bank charge') || name.includes('interest') || name.includes('loan')) {
        financialExpenses.push(item)
      } else {
        // Default to operating expenses
        operatingExpenses.push(item)
      }
    }

    if (directCosts.length > 0) {
      const subtotal = directCosts.reduce((sum, item) => sum + item.amount, 0)
      expenseCategories.push({ category: 'Direct Costs', items: directCosts, subtotal })
    }
    if (operatingExpenses.length > 0) {
      const subtotal = operatingExpenses.reduce((sum, item) => sum + item.amount, 0)
      expenseCategories.push({ category: 'Operating Expenses', items: operatingExpenses, subtotal })
    }
    if (adminExpenses.length > 0) {
      const subtotal = adminExpenses.reduce((sum, item) => sum + item.amount, 0)
      expenseCategories.push({ category: 'Administrative Expenses', items: adminExpenses, subtotal })
    }
    if (financialExpenses.length > 0) {
      const subtotal = financialExpenses.reduce((sum, item) => sum + item.amount, 0)
      expenseCategories.push({ category: 'Financial Expenses', items: financialExpenses, subtotal })
    }

    // Calculate totals
    const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.subtotal, 0)
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.subtotal, 0)
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    const profitLoss: ProfitLossData = {
      fromDate,
      toDate,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      income: incomeCategories,
      expenses: expenseCategories,
      totals: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100
      }
    }

    return NextResponse.json(profitLoss)
  } catch (error) {
    console.error("[Profit & Loss API] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate profit & loss statement" }, 
      { status: 500 }
    )
  }
}
