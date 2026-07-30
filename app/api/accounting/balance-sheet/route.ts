import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

interface BalanceSheetItem {
  name: string
  amount: number
  accountId?: number
}

interface BalanceSheetData {
  asOnDate: string
  currentAssets: BalanceSheetItem[]
  fixedAssets: BalanceSheetItem[]
  currentLiabilities: BalanceSheetItem[]
  longTermLiabilities: BalanceSheetItem[]
  equity: BalanceSheetItem[]
  totals: {
    totalCurrentAssets: number
    totalFixedAssets: number
    totalAssets: number
    totalCurrentLiabilities: number
    totalLongTermLiabilities: number
    totalLiabilities: number
    totalEquity: number
    totalLiabilitiesAndEquity: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const asOnDate = searchParams.get("asOnDate") || new Date().toISOString().split("T")[0]

    // Get all bank/cash accounts with their balances
    const bankCashAccounts = await sql`
      SELECT 
        id,
        account_title,
        COALESCE((
          SELECT ibc.initial_balance
          FROM initial_bank_cash ibc
          WHERE ibc.bank_cash_id = bank_cash_accounts.id
            AND ibc.date <= ${asOnDate}
          ORDER BY ibc.date DESC, ibc.id DESC
          LIMIT 1
        ), 0) as initial_balance,
        COALESCE(
          (SELECT SUM(amount) FROM vouchers WHERE bank_cash_id = bank_cash_accounts.id AND voucher_type = 'Credit' AND date <= ${asOnDate}),
          0
        ) as total_credits,
        COALESCE(
          (SELECT SUM(amount) FROM vouchers WHERE bank_cash_id = bank_cash_accounts.id AND voucher_type = 'Debit' AND date <= ${asOnDate}),
          0
        ) as total_debits,
        COALESCE(
          (SELECT SUM(amount) FROM vouchers WHERE cr_bank_cash_id = bank_cash_accounts.id AND date <= ${asOnDate}),
          0
        ) as contra_credits,
        COALESCE(
          (SELECT SUM(amount) FROM vouchers WHERE dr_bank_cash_id = bank_cash_accounts.id AND date <= ${asOnDate}),
          0
        ) as contra_debits
      FROM bank_cash_accounts
      WHERE is_active = true
      ORDER BY account_title
    `

    // Calculate current balances for bank/cash accounts
    const currentAssets: BalanceSheetItem[] = []
    
    for (const account of bankCashAccounts) {
      const balance = 
        Number(account.initial_balance) + 
        Number(account.total_credits) - 
        Number(account.total_debits) +
        Number(account.contra_credits) -
        Number(account.contra_debits)
      
      if (balance !== 0) {
        currentAssets.push({
          name: account.account_title,
          amount: balance,
          accountId: account.id
        })
      }
    }

    // Get income/expense heads with their balances (for receivables, payables, etc.)
    const expenseHeads = await sql`
      SELECT
        ieh.id,
        ieh.head_name,
        iet.name as type_name,
        ieh.account_category,
        ieh.type,
        (
          COALESCE((
            SELECT SUM(amount)
            FROM vouchers
            WHERE expense_head_id = ieh.id
              AND voucher_type = 'Credit'
              AND date <= ${asOnDate}
          ), 0)
          +
          COALESCE((
            SELECT SUM(COALESCE(jvd.credit_amount, 0))
            FROM journal_voucher_details jvd
            INNER JOIN vouchers vj ON vj.id = jvd.voucher_id
            WHERE jvd.expense_head_id = ieh.id
              AND vj.voucher_type = 'Journal'
              AND vj.date <= ${asOnDate}
          ), 0)
        ) as total_credits,
        (
          COALESCE((
            SELECT SUM(amount)
            FROM vouchers
            WHERE expense_head_id = ieh.id
              AND voucher_type = 'Debit'
              AND date <= ${asOnDate}
          ), 0)
          +
          COALESCE((
            SELECT SUM(COALESCE(jvd.debit_amount, 0))
            FROM journal_voucher_details jvd
            INNER JOIN vouchers vj ON vj.id = jvd.voucher_id
            WHERE jvd.expense_head_id = ieh.id
              AND vj.voucher_type = 'Journal'
              AND vj.date <= ${asOnDate}
          ), 0)
        ) as total_debits
      FROM income_expense_heads ieh
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      WHERE ieh.is_active = true
    `

    // Classify accounts by type
    const fixedAssets: BalanceSheetItem[] = []
    const currentLiabilities: BalanceSheetItem[] = []
    const longTermLiabilities: BalanceSheetItem[] = []
    const equityItems: BalanceSheetItem[] = []

    // Calculate profit/loss from income and expenses
    let totalIncome = 0
    let totalExpense = 0

    for (const head of expenseHeads) {
      const balance = Number(head.total_credits) - Number(head.total_debits)
      
      if (balance === 0) continue

      const headName = String(head.head_name || '').toLowerCase()
      // account_category values seeded from the chart of accounts:
      // "Current Assets", "Fixed Assets", "Current Liabilities",
      // "Long-term Liab.", "Equity", "Revenue", "Expenses" (+ "* Parent" group rows)
      const category = String(head.account_category || '').toLowerCase()

      // Income/expense for the current-year P&L figure.
      // Revenue heads are Cr-normal (credits increase them); expenses Dr-normal.
      if (category.startsWith('revenue')) {
        totalIncome += balance
        continue
      }
      if (category.startsWith('expense')) {
        totalExpense += -balance // Dr-normal: debits exceed credits => positive expense
        continue
      }

      // Classification priority: explicit account_category -> keyword fallback.
      if (category.includes('asset')) {
        if (category.includes('fixed') ||
            headName.includes('land') || headName.includes('building') ||
            headName.includes('machinery') || headName.includes('equipment') ||
            headName.includes('vehicle') || headName.includes('furniture')) {
          fixedAssets.push({
            name: head.head_name,
            amount: Math.abs(balance),
            accountId: head.id
          })
        } else {
          currentAssets.push({
            name: head.head_name,
            amount: Math.abs(balance),
            accountId: head.id
          })
        }
      } else if (category.includes('liab')) {
        if (category.includes('long') ||
            (headName.includes('loan') && (headName.includes('long') || headName.includes('term')))) {
          longTermLiabilities.push({
            name: head.head_name,
            amount: Math.abs(balance),
            accountId: head.id
          })
        } else {
          currentLiabilities.push({
            name: head.head_name,
            amount: Math.abs(balance),
            accountId: head.id
          })
        }
      } else if (category.includes('equity')) {
        equityItems.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      } else if (headName.includes('land') || headName.includes('building') || 
          headName.includes('machinery') || headName.includes('equipment') || 
          headName.includes('vehicle') || headName.includes('furniture')) {
        fixedAssets.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      } else if (headName.includes('receivable') || headName.includes('advance to')) {
        currentAssets.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      } else if (headName.includes('payable') || headName.includes('advance from')) {
        currentLiabilities.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      } else if (headName.includes('loan') && (headName.includes('long') || headName.includes('term'))) {
        longTermLiabilities.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      } else if (headName.includes('capital') || headName.includes('equity') || headName.includes('reserve')) {
        equityItems.push({
          name: head.head_name,
          amount: Math.abs(balance),
          accountId: head.id
        })
      }
    }

    // Calculate current year profit/loss
    const currentYearProfit = totalIncome - totalExpense
    
    // Add profit/loss to equity
    if (currentYearProfit !== 0) {
      equityItems.push({
        name: currentYearProfit > 0 ? "Current Year Profit" : "Current Year Loss",
        amount: Math.abs(currentYearProfit)
      })
    }

    // If no equity found, add a placeholder capital account
    if (equityItems.length === 0) {
      equityItems.push({
        name: "Capital (Opening Balance)",
        amount: 0
      })
    }

    // Calculate totals
    const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.amount, 0)
    const totalFixedAssets = fixedAssets.reduce((sum, item) => sum + item.amount, 0)
    const totalAssets = totalCurrentAssets + totalFixedAssets

    const totalCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.amount, 0)
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, item) => sum + item.amount, 0)
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

    const totalEquity = equityItems.reduce((sum, item) => sum + item.amount, 0)
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    // Balance the sheet - if there's a difference, adjust equity
    const difference = totalAssets - totalLiabilitiesAndEquity
    if (Math.abs(difference) > 0.01) {
      if (difference > 0) {
        equityItems.push({
          name: "Balancing Figure (Retained Earnings)",
          amount: difference
        })
      } else {
        equityItems.push({
          name: "Balancing Figure (Accumulated Loss)",
          amount: Math.abs(difference)
        })
      }
    }

    // Recalculate totals after balancing
    const finalTotalEquity = equityItems.reduce((sum, item) => sum + item.amount, 0)
    const finalTotalLiabilitiesAndEquity = totalLiabilities + finalTotalEquity

    const balanceSheet: BalanceSheetData = {
      asOnDate,
      currentAssets: currentAssets.sort((a, b) => b.amount - a.amount),
      fixedAssets: fixedAssets.sort((a, b) => b.amount - a.amount),
      currentLiabilities: currentLiabilities.sort((a, b) => b.amount - a.amount),
      longTermLiabilities: longTermLiabilities.sort((a, b) => b.amount - a.amount),
      equity: equityItems,
      totals: {
        totalCurrentAssets,
        totalFixedAssets,
        totalAssets,
        totalCurrentLiabilities,
        totalLongTermLiabilities,
        totalLiabilities,
        totalEquity: finalTotalEquity,
        totalLiabilitiesAndEquity: finalTotalLiabilitiesAndEquity
      }
    }

    return NextResponse.json(balanceSheet)
  } catch (error) {
    console.error("[Balance Sheet API] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate balance sheet" }, 
      { status: 500 }
    )
  }
}
