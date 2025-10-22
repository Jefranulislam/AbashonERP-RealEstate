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
    const asOnDate = searchParams.get("asOnDate")

    if (!asOnDate) {
      return NextResponse.json(
        { error: "asOnDate is required" },
        { status: 400 }
      )
    }

    console.log("[Balance Sheet] As on date:", asOnDate)

    // Calculate account balances as of the specified date
    // Assets: Debit balance accounts (Debit > Credit)
    // Liabilities: Credit balance accounts (Credit > Debit)
    const accountBalances = await sql`
      WITH account_transactions AS (
        SELECT 
          ieh.id as account_id,
          ieh.head_name as account_name,
          ieh.account_code,
          ieh.head_type as account_type,
          ieh.account_category,
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
        WHERE v.date <= ${asOnDate}
          AND v.is_confirmed = true
      ),
      account_balances AS (
        SELECT 
          account_id,
          account_name,
          account_code,
          account_type,
          account_category,
          SUM(debit_amount) as total_debit,
          SUM(credit_amount) as total_credit,
          SUM(debit_amount) - SUM(credit_amount) as balance
        FROM account_transactions
        GROUP BY account_id, account_name, account_code, account_type, account_category
      )
      SELECT 
        account_id,
        account_name,
        account_code,
        account_type,
        account_category,
        total_debit,
        total_credit,
        balance,
        CASE 
          WHEN balance > 0 THEN 'Debit'
          WHEN balance < 0 THEN 'Credit'
          ELSE 'Zero'
        END as balance_type
      FROM account_balances
      WHERE balance != 0
      ORDER BY account_code, account_name
    `

    // Classify accounts
    const assets = {
      currentAssets: [] as any[],
      fixedAssets: [] as any[],
    }

    const liabilities = {
      currentLiabilities: [] as any[],
      longTermLiabilities: [] as any[],
    }

    const equity: any[] = []

    accountBalances.forEach((account: any) => {
      const balance = Number(account.balance)
      const absBalance = Math.abs(balance)
      const category = account.account_category?.toLowerCase() || ""
      const type = account.account_type?.toLowerCase() || ""

      const item = {
        name: account.account_name,
        code: account.account_code || "",
        amount: absBalance,
      }

      // Classification logic based on account category and balance type
      if (balance > 0) {
        // Debit balance - typically assets
        if (
          category.includes("current") ||
          category.includes("cash") ||
          category.includes("bank") ||
          category.includes("receivable") ||
          category.includes("inventory")
        ) {
          assets.currentAssets.push(item)
        } else if (
          category.includes("fixed") ||
          category.includes("property") ||
          category.includes("equipment") ||
          category.includes("building") ||
          category.includes("land") ||
          category.includes("vehicle")
        ) {
          assets.fixedAssets.push(item)
        } else if (type.includes("asset")) {
          assets.fixedAssets.push(item)
        } else {
          // Default debit balance to fixed assets
          assets.fixedAssets.push(item)
        }
      } else {
        // Credit balance - typically liabilities or equity
        if (
          category.includes("payable") ||
          category.includes("current liability") ||
          category.includes("short-term")
        ) {
          liabilities.currentLiabilities.push(item)
        } else if (
          category.includes("long-term") ||
          category.includes("loan") ||
          category.includes("mortgage")
        ) {
          liabilities.longTermLiabilities.push(item)
        } else if (
          category.includes("capital") ||
          category.includes("equity") ||
          category.includes("retained")
        ) {
          equity.push(item)
        } else if (type.includes("liability")) {
          liabilities.longTermLiabilities.push(item)
        } else {
          // Default credit balance to equity
          equity.push(item)
        }
      }
    })

    // Calculate totals
    const totalCurrentAssets = assets.currentAssets.reduce(
      (sum, item) => sum + item.amount,
      0
    )
    const totalFixedAssets = assets.fixedAssets.reduce(
      (sum, item) => sum + item.amount,
      0
    )
    const totalAssets = totalCurrentAssets + totalFixedAssets

    const totalCurrentLiabilities = liabilities.currentLiabilities.reduce(
      (sum, item) => sum + item.amount,
      0
    )
    const totalLongTermLiabilities = liabilities.longTermLiabilities.reduce(
      (sum, item) => sum + item.amount,
      0
    )
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0)

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01

    console.log(
      `[Balance Sheet] Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${totalEquity}, Balanced: ${isBalanced}`
    )

    return NextResponse.json({
      assets,
      liabilities,
      equity,
      totalCurrentAssets,
      totalFixedAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
    })
  } catch (error) {
    console.error("[Balance Sheet] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
