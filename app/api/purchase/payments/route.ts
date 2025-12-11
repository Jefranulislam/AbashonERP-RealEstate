import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

// GET: List all payment transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const poId = searchParams.get("poId")
    const vendorId = searchParams.get("vendorId")
    const projectId = searchParams.get("projectId")
    const paymentType = searchParams.get("paymentType")
    const status = searchParams.get("status")

    let query = sql`
      SELECT 
        pt.*,
        po.po_number,
        v.vendor_name,
        c.constructor_name,
        p.project_name,
        bca.account_title as bank_account_name,
        e.name as verified_by_name
      FROM payment_transactions pt
      LEFT JOIN purchase_orders po ON pt.po_id = po.id
      LEFT JOIN vendors v ON pt.vendor_id = v.id
      LEFT JOIN constructors c ON pt.constructor_id = c.id
      LEFT JOIN projects p ON pt.project_id = p.id
      LEFT JOIN bank_cash_accounts bca ON pt.bank_account_id = bca.id
      LEFT JOIN employees e ON pt.verified_by = e.id
      WHERE pt.is_active = true
    `

    if (poId) query = sql`${query} AND pt.po_id = ${poId}`
    if (vendorId && vendorId !== 'all') query = sql`${query} AND pt.vendor_id = ${vendorId}`
    if (projectId && projectId !== 'all') query = sql`${query} AND pt.project_id = ${projectId}`
    if (paymentType && paymentType !== 'all') query = sql`${query} AND pt.payment_type = ${paymentType}`
    if (status && status !== 'all') query = sql`${query} AND pt.payment_status = ${status}`

    query = sql`${query} ORDER BY pt.payment_date DESC, pt.created_at DESC`

    const payments = await query

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Record new payment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Generate payment number
    const lastPayment = await sql`
      SELECT payment_number FROM payment_transactions 
      WHERE payment_number LIKE ${'PAY-' + new Date().getFullYear() + '-%'}
      ORDER BY created_at DESC LIMIT 1
    `
    
    const year = new Date().getFullYear()
    const lastNum = lastPayment.length > 0 ? parseInt(lastPayment[0].payment_number.split('-')[2]) : 0
    const paymentNumber = `PAY-${year}-${String(lastNum + 1).padStart(4, '0')}`

    // Auto-create voucher if requested
    let voucherId = null
    if (data.createVoucher) {
      // Generate voucher number
      const lastVoucher = await sql`
        SELECT voucher_no FROM vouchers 
        WHERE voucher_no LIKE ${'DV-' + year + '-%'}
        ORDER BY created_at DESC LIMIT 1
      `
      
      const lastVoucherNum = lastVoucher.length > 0 ? parseInt(lastVoucher[0].voucher_no.split('-')[2]) : 0
      const voucherNo = `DV-${year}-${String(lastVoucherNum + 1).padStart(4, '0')}`

      const voucher = await sql`
        INSERT INTO vouchers (
          voucher_no,
          voucher_type,
          project_id,
          expense_head_id,
          bank_cash_id,
          date,
          amount,
          particulars,
          cheque_number,
          is_confirmed
        ) VALUES (
          ${voucherNo},
          'Debit',
          ${data.projectId || null},
          ${data.expenseHeadId || null},
          ${data.bankAccountId || null},
          ${data.paymentDate},
          ${data.amount},
          ${data.remarks || 'Payment for PO: ' + data.poNumber},
          ${data.chequeNumber || null},
          true
        )
        RETURNING id
      `
      voucherId = voucher[0].id
    }

    const payment = await sql`
      INSERT INTO payment_transactions (
        payment_number,
        po_id,
        delivery_id,
        schedule_id,
        vendor_id,
        constructor_id,
        project_id,
        payment_date,
        payment_time,
        payment_type,
        payment_method,
        amount,
        bank_account_id,
        cheque_number,
        cheque_date,
        bank_name,
        branch_name,
        transaction_reference,
        voucher_id,
        receipt_number,
        receipt_issued_by,
        receipt_date,
        payment_status,
        verified_by,
        verification_date,
        remarks,
        attachments
      ) VALUES (
        ${paymentNumber},
        ${data.poId || null},
        ${data.deliveryId || null},
        ${data.scheduleId || null},
        ${data.vendorId || null},
        ${data.constructorId || null},
        ${data.projectId || null},
        ${data.paymentDate},
        ${data.paymentTime || null},
        ${data.paymentType},
        ${data.paymentMethod},
        ${data.amount},
        ${data.bankAccountId || null},
        ${data.chequeNumber || null},
        ${data.chequeDate || null},
        ${data.bankName || null},
        ${data.branchName || null},
        ${data.transactionReference || null},
        ${voucherId},
        ${paymentNumber},
        ${user.name || 'System'},
        ${data.paymentDate},
        ${data.paymentStatus || 'Completed'},
        ${user.id || null},
        ${new Date().toISOString().split('T')[0]},
        ${data.remarks || null},
        ${data.attachments || null}
      )
      RETURNING *
    `

    // Create payment history
    await sql`
      INSERT INTO payment_history (
        payment_id,
        action_type,
        changed_by,
        new_amount,
        new_status,
        reason
      ) VALUES (
        ${payment[0].id},
        'Created',
        ${user.id || null},
        ${data.amount},
        ${data.paymentStatus || 'Completed'},
        'Payment created'
      )
    `

    return NextResponse.json({ success: true, payment: payment[0] })
  } catch (error) {
    console.error("[v0] Error recording payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
