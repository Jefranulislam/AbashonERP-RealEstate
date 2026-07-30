import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo } from "@/lib/voucher-utils"
import { ensureVoucherPaymentSchema } from "@/lib/voucher-schema"

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
        pt.payment_status as status,
        pt.transaction_reference as reference_number,
        po.po_number,
        v.vendor_name,
        v.mailing_address as vendor_address,
        v.phone as vendor_phone,
        v.email as vendor_email,
        c.constructor_name,
        p.project_name,
        bca.account_title as bank_account_name,
        e.name as verified_by_name,
        vo.voucher_no as voucher_number,
        COALESCE(ieh.head_name, NULLIF(TRIM(vo.account_head_type), '')) as head_of_account
      FROM payment_transactions pt
      LEFT JOIN purchase_orders po ON pt.po_id = po.id
      LEFT JOIN vendors v ON pt.vendor_id = v.id
      LEFT JOIN constructors c ON pt.constructor_id = c.id
      LEFT JOIN projects p ON pt.project_id = p.id
      LEFT JOIN bank_cash_accounts bca ON pt.bank_account_id = bca.id
      LEFT JOIN employees e ON pt.verified_by = e.id
      LEFT JOIN vouchers vo ON pt.voucher_id = vo.id
      LEFT JOIN income_expense_heads ieh ON vo.expense_head_id = ieh.id
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
    console.error("Error fetching payments:", error)
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

    await ensureVoucherPaymentSchema()

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
      const voucherCount = await sql`
        SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = 'Debit'
      `
      const voucherNo = buildVoucherNo('Debit', Number(voucherCount[0].count) + 1, year)

      // Denormalize party name + head so the voucher prints correctly on its own
      const isContractor = !data.vendorId && !!data.constructorId
      const partyNameResult = data.vendorId
        ? await sql`SELECT vendor_name AS name FROM vendors WHERE id = ${data.vendorId} LIMIT 1`
        : data.constructorId
          ? await sql`SELECT constructor_name AS name FROM constructors WHERE id = ${data.constructorId} LIMIT 1`
          : []
      const partyName = partyNameResult[0]?.name || data.referencePartyName || null

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
          payment_method,
          cheque_number,
          cheque_date,
          vendor_id,
          constructor_id,
          vendor_name,
          account_head_type,
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
          ${data.paymentMethod || null},
          ${data.chequeNumber || null},
          ${data.chequeDate || null},
          ${data.vendorId || null},
          ${data.constructorId || null},
          ${partyName},
          ${isContractor ? 'Contractor Bill' : 'Vendor Payment'},
          true
        )
        RETURNING id
      `
      voucherId = voucher[0].id
    }

    // Validate party data - must have a vendor, a contractor, or a reference party name.
    // A PO is raised to EITHER a vendor OR a contractor, so a contractor payment carries
    // constructorId (not vendorId) and must be accepted here.
    if (!data.vendorId && !data.constructorId && !data.referencePartyName) {
      return NextResponse.json(
        { error: "A vendor, contractor, or reference party name must be provided" },
        { status: 400 }
      )
    }

    // If reference_party_name is provided, reference_party_type must be set
    if (data.referencePartyName && !data.referencePartyType) {
      return NextResponse.json(
        { error: "Reference party type must be specified when party name is provided" },
        { status: 400 }
      )
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
        attachments,
        reference_party_type,
        reference_party_name
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
        ${data.verifiedBy || null},
        ${new Date().toISOString().split('T')[0]},
        ${data.remarks || null},
        ${data.attachments || null},
        ${data.referencePartyType || null},
        ${data.referencePartyName || null}
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
        ${null},
        ${data.amount},
        ${data.paymentStatus || 'Completed'},
        'Payment created'
      )
    `

    return NextResponse.json({ success: true, payment: payment[0] })
  } catch (error) {
    console.error("Error recording payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
