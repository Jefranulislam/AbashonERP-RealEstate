import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo } from "@/lib/voucher-utils"

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
    console.error("[v0] Error fetching advance payable:", error)
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
    const amount = parseFloat(data.amount)
    const paymentDate = data.paymentDate
    const paymentType = data.paymentType || 'Advance'
    const paymentMethod = data.paymentMethod || null
    const paymentStatus = (data.status || 'Pending')

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
      const partyNameResult = data.vendorId
        ? await sql`SELECT vendor_name AS name FROM vendors WHERE id = ${data.vendorId} LIMIT 1`
        : await sql`SELECT constructor_name AS name FROM constructors WHERE id = ${data.constructorId} LIMIT 1`
      const partyName = partyNameResult[0]?.name || null

      let voucherId: number | null = null
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
            voucher_no, voucher_type, project_id, bank_cash_id,
            date, amount, particulars, is_confirmed, vendor_name, account_head_type
          ) VALUES (
            ${voucherNo}, 'Debit', ${data.projectId}, ${null},
            ${paymentDate}, ${amount},
            ${`${data.description || `Vendor payment (${paymentType})`} ${syncTag}`},
            true,
            ${partyName},
            'Vendor Payment'
          )
          RETURNING id
        `
        voucherId = voucher[0]?.id ?? null
      }

      const existingPaymentTx = await sql`
        SELECT id FROM payment_transactions WHERE remarks LIKE ${`%${syncTag}%`} LIMIT 1
      `
      if (existingPaymentTx.length === 0) {
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
      console.error("[v0] Error: updated advance payable but failed ledger sync:", syncError)
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
    console.error("[v0] Error updating advance payable:", error)
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
    console.error("[v0] Error deleting advance payable:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
