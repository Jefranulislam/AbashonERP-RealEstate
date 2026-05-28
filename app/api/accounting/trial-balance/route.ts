import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

interface TrialBalanceAccount {
  accountId: number
  accountName: string
  accountType: string
  debit: number
  credit: number
  balance: number
}

interface TrialBalanceData {
  fromDate: string
  toDate: string
  projectId?: number
  projectName?: string
  accounts: TrialBalanceAccount[]
  totals: {
    totalDebit: number
    totalCredit: number
    difference: number
    isBalanced: boolean
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

    // Build dynamic filters for voucher/journal queries
    const voucherProjectFilter = projectId ? sql`AND v.project_id = ${projectId}` : sql``
    const journalProjectFilter = projectId ? sql`AND jd.project_id = ${projectId}` : sql``

    // Get project name if filtered
    let projectName = null
    if (projectId) {
      const projectResult = await sql`
        SELECT project_name FROM projects WHERE id = ${projectId}
      `
      projectName = projectResult[0]?.project_name || null
    }

    // Fetch expense head movement from Credit/Debit vouchers and Journal details.
    const expenseHeadBalances = await sql`
      SELECT 
        ieh.id as account_id,
        ieh.head_name as account_name,
        iet.name as account_type,
        COALESCE(vb.total_debit, 0) + COALESCE(jb.total_debit, 0) as total_debit,
        COALESCE(vb.total_credit, 0) + COALESCE(jb.total_credit, 0) as total_credit
      FROM income_expense_heads ieh
      LEFT JOIN income_expense_types iet ON ieh.inc_exp_type_id = iet.id
      LEFT JOIN (
        SELECT
          v.expense_head_id,
          SUM(CASE WHEN v.voucher_type = 'Debit' THEN v.amount ELSE 0 END) as total_debit,
          SUM(CASE WHEN v.voucher_type = 'Credit' THEN v.amount ELSE 0 END) as total_credit
        FROM vouchers v
        WHERE v.expense_head_id IS NOT NULL
          AND v.date >= ${fromDate}
          AND v.date <= ${toDate}
          ${voucherProjectFilter}
        GROUP BY v.expense_head_id
      ) vb ON vb.expense_head_id = ieh.id
      LEFT JOIN (
        SELECT
          jd.expense_head_id,
          SUM(COALESCE(jd.debit_amount, 0)) as total_debit,
          SUM(COALESCE(jd.credit_amount, 0)) as total_credit
        FROM journal_voucher_details jd
        INNER JOIN vouchers vj ON vj.id = jd.voucher_id
        WHERE vj.voucher_type = 'Journal'
          AND vj.date >= ${fromDate}
          AND vj.date <= ${toDate}
          ${journalProjectFilter}
        GROUP BY jd.expense_head_id
      ) jb ON jb.expense_head_id = ieh.id
      WHERE ieh.is_active = true
      GROUP BY ieh.id, ieh.head_name, iet.name
      HAVING (COALESCE(vb.total_debit, 0) + COALESCE(jb.total_debit, 0)) > 0
         OR (COALESCE(vb.total_credit, 0) + COALESCE(jb.total_credit, 0)) > 0
      ORDER BY iet.name, ieh.head_name
    `

    // Fetch bank/cash account balances using accounting entry directions.
    const bankCashBalances = await sql`
      SELECT 
        bca.id as account_id,
        bca.account_title as account_name,
        COALESCE((
          SELECT ibc.initial_balance
          FROM initial_bank_cash ibc
          WHERE ibc.bank_cash_id = bca.id
            AND ibc.date <= ${toDate}
          ORDER BY ibc.date DESC, ibc.id DESC
          LIMIT 1
        ), 0) as initial_balance,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Credit' AND v.bank_cash_id = bca.id THEN v.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN v.voucher_type = 'Debit' AND v.bank_cash_id = bca.id THEN v.amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN v.cr_bank_cash_id = bca.id THEN v.amount ELSE 0 END), 0) as contra_debit,
        COALESCE(SUM(CASE WHEN v.dr_bank_cash_id = bca.id THEN v.amount ELSE 0 END), 0) as contra_credit
      FROM bank_cash_accounts bca
      LEFT JOIN vouchers v ON v.date >= ${fromDate} AND v.date <= ${toDate} ${voucherProjectFilter}
      WHERE bca.is_active = true
      GROUP BY bca.id, bca.account_title
      ORDER BY bca.account_title
    `

    const accounts: TrialBalanceAccount[] = []

    // Process expense heads (Income/Expense accounts)
    for (const row of expenseHeadBalances) {
      const totalCredit = Number(row.total_credit)
      const totalDebit = Number(row.total_debit)
      const balance = totalDebit - totalCredit

      let debit = 0
      let credit = 0

      if (balance >= 0) debit = balance
      else credit = Math.abs(balance)

      // Only include accounts with non-zero balances
      if (debit > 0 || credit > 0) {
        accounts.push({
          accountId: row.account_id,
          accountName: row.account_name,
          accountType: row.account_type || 'Expense',
          debit,
          credit,
          balance
        })
      }
    }

    // Process bank/cash accounts (Asset accounts)
    for (const row of bankCashBalances) {
      const initialBalance = Number(row.initial_balance)
      const totalDebit = Number(row.total_debit) + Number(row.contra_debit)
      const totalCredit = Number(row.total_credit) + Number(row.contra_credit)
      const balance = initialBalance + totalDebit - totalCredit

      // Bank/Cash accounts are assets, so debit balance is normal
      let debit = 0
      let credit = 0

      if (balance >= 0) {
        debit = balance
      } else {
        credit = Math.abs(balance)
      }

      // Only include accounts with non-zero balances
      if (debit > 0 || credit > 0) {
        accounts.push({
          accountId: row.account_id,
          accountName: row.account_name,
          accountType: 'Asset',
          debit,
          credit,
          balance
        })
      }
    }

    // Sort accounts: Assets first, then Income, then Expenses
    accounts.sort((a, b) => {
      const typeOrder = { 'Asset': 1, 'Income': 2, 'Expense': 3 }
      const orderA = typeOrder[a.accountType as keyof typeof typeOrder] || 4
      const orderB = typeOrder[b.accountType as keyof typeof typeOrder] || 4
      
      if (orderA !== orderB) return orderA - orderB
      return a.accountName.localeCompare(b.accountName)
    })

    // Calculate totals
    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0)
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0)
    const difference = Math.abs(totalDebit - totalCredit)
    const isBalanced = difference < 0.01

    const trialBalance: TrialBalanceData = {
      fromDate,
      toDate,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      accounts,
      totals: {
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        isBalanced
      }
    }

    return NextResponse.json(trialBalance)
  } catch (error) {
    console.error("[Trial Balance API] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate trial balance" }, 
      { status: 500 }
    )
  }
}
