import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo } from "@/lib/voucher-utils"
import { ensureVoucherPaymentSchema } from "@/lib/voucher-schema"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt((await context.params).id)
    const res = await sql`
      SELECT 
        ap.*, 
        p.project_name, 
        v.vendor_name, 
        c.constructor_name
      FROM advance_payables ap
      LEFT JOIN projects p ON ap.project_id = p.id
      LEFT JOIN vendors v ON ap.vendor_id = v.id
      LEFT JOIN constructors c ON ap.constructor_id = c.id
      WHERE ap.id = ${id}
      LIMIT 1
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ advancePayable: res[0] })
  } catch (error) {
    console.error("Error fetching advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt((await context.params).id)
    const data = await request.json()

    await ensureVoucherPaymentSchema()

    const amount = parseFloat(data.amount)
    const paymentDate = data.paymentDate
    const paymentType = data.paymentType || 'Advance'
    const paymentMethod = data.paymentMethod || null
    const paymentStatus = (data.status || 'Pending')
    const chosenExpenseHeadId = Number(data.expenseHeadId) > 0 ? Number(data.expenseHeadId) : null
    const chosenBankCashId = Number(data.bankCashId) > 0 ? Number(data.bankCashId) : null

    const res = await sql`
      UPDATE advance_payables SET
        project_id = ${data.projectId},
        vendor_id = ${data.vendorId || null},
        constructor_id = ${data.constructorId || null},
        amount = ${amount},
        payment_date = ${paymentDate},
        payment_type = ${paymentType},
        payment_method = ${paymentMethod},
        reference_number = ${data.referenceNumber || null},
        description = ${data.description || null},
        status = ${paymentStatus},
        expense_head_id = ${chosenExpenseHeadId},
        bank_cash_id = ${chosenBankCashId},
        cheque_number = ${data.chequeNumber || null},
        cheque_date = ${data.chequeDate || null},
        is_active = ${data.isActive !== false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (res.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Ensure legacy/manual entries appear in payment and accounting modules.
    const syncTag = `[AdvancePayable:${id}]`
    try {
      const isContractor = !data.vendorId && !!data.constructorId
      const partyNameResult = data.vendorId
        ? await sql`SELECT vendor_name AS name FROM vendors WHERE id = ${data.vendorId} LIMIT 1`
        : await sql`SELECT constructor_name AS name FROM constructors WHERE id = ${data.constructorId} LIMIT 1`
      const partyName = partyNameResult[0]?.name || null

      // Head of Account: prefer the head chosen on the form; otherwise match by party type.
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

      const particulars = `${data.description || `${isContractor ? 'Contractor' : 'Vendor'} payment (${paymentType})`} ${syncTag}`

      let voucherId: number | null = null
      const existingVoucher = await sql`
        SELECT id FROM vouchers WHERE particulars LIKE ${`%${syncTag}%`} LIMIT 1
      `
      if (existingVoucher.length > 0) {
        // Keep the linked voucher in sync with the edited payment record
        voucherId = existingVoucher[0].id
        await sql`
          UPDATE vouchers SET
            project_id = ${data.projectId},
            expense_head_id = ${expenseHeadId},
            bank_cash_id = ${chosenBankCashId},
            date = ${paymentDate},
            amount = ${amount},
            particulars = ${particulars},
            payment_method = ${paymentMethod},
            cheque_number = ${data.chequeNumber || null},
            cheque_date = ${data.chequeDate || null},
            vendor_id = ${data.vendorId || null},
            constructor_id = ${data.constructorId || null},
            vendor_name = ${partyName},
            account_head_type = ${headName},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${voucherId}
        `
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
            ${particulars},
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

      const existingPaymentTx = await sql`
        SELECT id FROM payment_transactions WHERE remarks LIKE ${`%${syncTag}%`} LIMIT 1
      `
      if (existingPaymentTx.length > 0) {
        // Keep the linked payment transaction in sync too
        await sql`
          UPDATE payment_transactions SET
            vendor_id = ${data.vendorId || null},
            constructor_id = ${data.constructorId || null},
            project_id = ${data.projectId || null},
            payment_date = ${paymentDate},
            payment_type = ${paymentType},
            payment_method = ${paymentMethod},
            amount = ${amount},
            bank_account_id = ${chosenBankCashId},
            cheque_number = ${data.chequeNumber || null},
            cheque_date = ${data.chequeDate || null},
            transaction_reference = ${data.referenceNumber || null},
            payment_status = ${paymentStatus.toLowerCase() === 'paid' ? 'Completed' : 'Pending'},
            remarks = ${`${data.description || ''} ${syncTag}`.trim()},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingPaymentTx[0].id}
        `
      } else {
        const payNoResult = await sql`
          SELECT payment_number FROM payment_transactions
          WHERE payment_number LIKE ${'PAY-' + new Date().getFullYear() + '-%'}
          ORDER BY created_at DESC LIMIT 1
        `
        const lastNum = payNoResult.length > 0 ? parseInt(payNoResult[0].payment_number.split('-')[2]) : 0
        const paymentNumber = `PAY-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, '0')}`

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
      console.error("Error: updated advance payable but failed ledger sync:", syncError)
      return NextResponse.json(
        {
          error: "Failed to sync updated payment with accounting ledgers.",
          details: syncError instanceof Error ? syncError.message : String(syncError),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      advancePayable: res[0] 
    })
  } catch (error) {
    console.error("Error updating advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt((await context.params).id)
    
    // Soft delete by setting is_active to false
    await sql`
      UPDATE advance_payables 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
