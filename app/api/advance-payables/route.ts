import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo } from "@/lib/voucher-utils"
import { ensureVoucherPaymentSchema } from "@/lib/voucher-schema"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureVoucherPaymentSchema()

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const paymentType = searchParams.get("paymentType")

    const query = await sql`
      SELECT
        ap.*,
        p.project_name,
        v.vendor_name,
        c.constructor_name,
        ieh.head_name as expense_head_name,
        ieh.account_code as expense_head_code,
        bca.account_title as bank_cash_name,
        'advance_payable' as source
      FROM advance_payables ap
      LEFT JOIN projects p ON ap.project_id = p.id
      LEFT JOIN vendors v ON ap.vendor_id = v.id
      LEFT JOIN constructors c ON ap.constructor_id = c.id
      LEFT JOIN income_expense_heads ieh ON ap.expense_head_id = ieh.id
      LEFT JOIN bank_cash_accounts bca ON ap.bank_cash_id = bca.id
      WHERE ap.is_active = true
      ORDER BY ap.payment_date DESC, ap.created_at DESC
    `

    // Also surface vendor/contractor payments recorded in OTHER modules
    // (purchase payments, PO payments) so this page shows the complete
    // payment history per party. Advance-payable-originated transactions
    // are excluded (matched by the sync tag in remarks) to avoid duplicates.
    const externalPayments = await sql`
      SELECT
        pt.id,
        pt.project_id,
        pt.vendor_id,
        pt.constructor_id,
        pt.amount,
        pt.payment_date,
        COALESCE(pt.payment_type, 'Payment') as payment_type,
        pt.payment_method,
        pt.transaction_reference as reference_number,
        pt.remarks as description,
        CASE WHEN pt.payment_status = 'Completed' THEN 'Paid' ELSE COALESCE(pt.payment_status, 'Pending') END as status,
        pt.is_active,
        pt.created_at,
        pt.cheque_number,
        pt.cheque_date,
        p.project_name,
        v.vendor_name,
        c.constructor_name,
        ieh.head_name as expense_head_name,
        ieh.account_code as expense_head_code,
        bca.account_title as bank_cash_name,
        po.po_number,
        pt.payment_number,
        'transaction' as source
      FROM payment_transactions pt
      LEFT JOIN projects p ON pt.project_id = p.id
      LEFT JOIN vendors v ON pt.vendor_id = v.id
      LEFT JOIN constructors c ON pt.constructor_id = c.id
      LEFT JOIN purchase_orders po ON pt.po_id = po.id
      LEFT JOIN vouchers vo ON pt.voucher_id = vo.id
      LEFT JOIN income_expense_heads ieh ON vo.expense_head_id = ieh.id
      LEFT JOIN bank_cash_accounts bca ON pt.bank_account_id = bca.id
      WHERE pt.is_active = true
        AND (pt.remarks IS NULL OR pt.remarks NOT LIKE '%[AdvancePayable:%')
      ORDER BY pt.payment_date DESC, pt.created_at DESC
    `

    let filteredResults = [...query, ...externalPayments].sort((a: any, b: any) =>
      String(b.payment_date || "").localeCompare(String(a.payment_date || ""))
    )
    if (projectId && projectId !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.project_id === parseInt(projectId))
    }
    if (status && status !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.status === status)
    }
    if (paymentType && paymentType !== "all") {
      filteredResults = filteredResults.filter((item: any) => item.payment_type === paymentType)
    }

    return NextResponse.json({ advancePayables: filteredResults })
  } catch (error) {
    console.error("Error fetching advance payables:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    await ensureVoucherPaymentSchema()

    // Validate required fields
    if (!data.projectId || !data.amount || !data.paymentDate) {
      return NextResponse.json(
        { error: "Project, amount, and payment date are required" },
        { status: 400 }
      )
    }

    // Validate that either vendor or constructor is selected
    if (!data.vendorId && !data.constructorId) {
      return NextResponse.json(
        { error: "Either vendor or constructor must be selected" },
        { status: 400 }
      )
    }

    const amount = parseFloat(data.amount)
    const paymentDate = data.paymentDate
    const paymentType = data.paymentType || 'Advance'
    const paymentMethod = data.paymentMethod || null
    const paymentStatus = (data.status || 'Pending')
    const chosenExpenseHeadId = Number(data.expenseHeadId) > 0 ? Number(data.expenseHeadId) : null
    const chosenBankCashId = Number(data.bankCashId) > 0 ? Number(data.bankCashId) : null

    const res = await sql`
      INSERT INTO advance_payables (
        project_id,
        vendor_id,
        constructor_id,
        amount,
        payment_date,
        payment_type,
        payment_method,
        reference_number,
        description,
        status,
        expense_head_id,
        bank_cash_id,
        cheque_number,
        cheque_date,
        is_active
      )
      VALUES (
        ${data.projectId},
        ${data.vendorId || null},
        ${data.constructorId || null},
        ${amount},
        ${paymentDate},
        ${paymentType},
        ${paymentMethod},
        ${data.referenceNumber || null},
        ${data.description || null},
        ${paymentStatus},
        ${chosenExpenseHeadId},
        ${chosenBankCashId},
        ${data.chequeNumber || null},
        ${data.chequeDate || null},
        ${data.isActive !== false}
      )
      RETURNING *
    `
    const advancePayable = res[0]
    const syncTag = `[AdvancePayable:${advancePayable.id}]`

    // Integrate with accounting + payment ledgers so entries appear across modules.
    let voucherId: number | null = null
    try {
      const isContractor = !data.vendorId && !!data.constructorId
      const partyNameResult = data.vendorId
        ? await sql`SELECT vendor_name AS name FROM vendors WHERE id = ${data.vendorId} LIMIT 1`
        : await sql`SELECT constructor_name AS name FROM constructors WHERE id = ${data.constructorId} LIMIT 1`
      const partyName = partyNameResult[0]?.name || null

      // Head of Account: prefer the head chosen on the form; otherwise fall back
      // to a head matching the party type — contractor payments are
      // "Contractor Bill", vendor payments are "Vendor Payment".
      let expenseHeadId: number | null = chosenExpenseHeadId
      let headName: string
      if (chosenExpenseHeadId) {
        const chosenHead = await sql`
          SELECT head_name FROM income_expense_heads WHERE id = ${chosenExpenseHeadId} LIMIT 1
        `
        headName = chosenHead[0]?.head_name ?? (isContractor ? 'Contractor Bill' : 'Vendor Payment')
      } else {
        const headLabel = isContractor ? 'Contractor Bill' : 'Vendor Payment'
        const headMatch = await sql`
          SELECT id, head_name FROM income_expense_heads
          WHERE is_active = true
            AND (
              head_name ILIKE ${isContractor ? '%contractor%' : '%vendor%'}
              OR head_name ILIKE ${headLabel}
            )
          ORDER BY (head_name ILIKE ${headLabel}) DESC, id
          LIMIT 1
        `
        expenseHeadId = headMatch[0]?.id ?? null
        headName = headMatch[0]?.head_name ?? headLabel
      }

      const existingVoucher = await sql`
        SELECT id FROM vouchers WHERE particulars LIKE ${`%${syncTag}%`} LIMIT 1
      `

      if (existingVoucher.length > 0) {
        voucherId = existingVoucher[0].id
      } else {
        const voucherNoResult = await sql`
          SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_no
          FROM vouchers
          WHERE voucher_type = 'Debit'
        `
        const voucherNo = buildVoucherNo('Debit', Number(voucherNoResult[0].next_no))

        const voucher = await sql`
          INSERT INTO vouchers (
            voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
            date, amount, particulars, payment_method, cheque_number, cheque_date, is_confirmed,
            vendor_id, constructor_id, vendor_name, account_head_type
          ) VALUES (
            ${voucherNo}, 'Debit', ${data.projectId}, ${expenseHeadId}, ${chosenBankCashId},
            ${paymentDate}, ${amount},
            ${`${data.description || `${isContractor ? 'Contractor' : 'Vendor'} payment (${paymentType})`} ${syncTag}`},
            ${paymentMethod},
            ${data.chequeNumber || null},
            ${data.chequeDate || null},
            true,
            ${data.vendorId || null},
            ${data.constructorId || null},
            ${partyName},
            ${headName}
          )
          RETURNING id
        `
        voucherId = voucher[0]?.id ?? null
      }

      const payNoResult = await sql`
        SELECT payment_number FROM payment_transactions
        WHERE payment_number LIKE ${'PAY-' + new Date().getFullYear() + '-%'}
        ORDER BY created_at DESC LIMIT 1
      `
      const lastNum = payNoResult.length > 0 ? parseInt(payNoResult[0].payment_number.split('-')[2]) : 0
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, '0')}`

      const existingPaymentTx = await sql`
        SELECT id FROM payment_transactions WHERE remarks LIKE ${`%${syncTag}%`} LIMIT 1
      `

      if (existingPaymentTx.length === 0) {
        await sql`
          INSERT INTO payment_transactions (
            payment_number,
            vendor_id,
            constructor_id,
            project_id,
            payment_date,
            payment_type,
            payment_method,
            amount,
            bank_account_id,
            cheque_number,
            cheque_date,
            transaction_reference,
            voucher_id,
            receipt_number,
            receipt_issued_by,
            receipt_date,
            payment_status,
            remarks
          ) VALUES (
            ${paymentNumber},
            ${data.vendorId || null},
            ${data.constructorId || null},
            ${data.projectId || null},
            ${paymentDate},
            ${paymentType},
            ${paymentMethod},
            ${amount},
            ${chosenBankCashId},
            ${data.chequeNumber || null},
            ${data.chequeDate || null},
            ${data.referenceNumber || null},
            ${voucherId},
            ${paymentNumber},
            ${user.name || 'System'},
            ${paymentDate},
            ${paymentStatus.toLowerCase() === 'paid' ? 'Completed' : 'Pending'},
            ${`${data.description || ''} ${syncTag}`.trim()}
          )
        `
      }
    } catch (syncError) {
      console.error('Error: created advance payable but failed ledger sync:', syncError)
      await sql`DELETE FROM advance_payables WHERE id = ${advancePayable.id}`
      return NextResponse.json(
        {
          error: "Failed to sync payment with accounting ledgers. Record was not saved.",
          details: syncError instanceof Error ? syncError.message : String(syncError),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      advancePayable 
    })
  } catch (error) {
    console.error("Error creating advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
