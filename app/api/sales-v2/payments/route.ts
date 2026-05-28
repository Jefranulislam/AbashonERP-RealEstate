import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sendSMS } from "@/lib/sms-service"
import { buildVoucherNo } from "@/lib/voucher-utils"

// GET - Fetch all payments
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const saleId = searchParams.get("saleId")
    const customerId = searchParams.get("customerId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let payments = await sql`
      SELECT 
        sp.*,
        s.sale_no,
        c.customer_name,
        c.phone as customer_phone,
        p.project_name,
        pr.product_name,
        pr.unit_no,
        bca.account_title as bank_account_name,
        e.name as received_by_name
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      LEFT JOIN customers c ON sp.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      LEFT JOIN bank_cash_accounts bca ON sp.bank_cash_id = bca.id
      LEFT JOIN employees e ON sp.received_by = e.id
      WHERE sp.is_active = true
      ${saleId ? sql`AND sp.sale_id = ${saleId}` : sql``}
      ${customerId ? sql`AND sp.customer_id = ${customerId}` : sql``}
      ${startDate ? sql`AND sp.payment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND sp.payment_date <= ${endDate}` : sql``}
      ORDER BY sp.payment_date DESC
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new payment (Money Receipt)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const saleId = Number(data.saleId)
    const scheduleId = data.scheduleId ? Number(data.scheduleId) : null
    const paymentAmount = parseFloat(data.amount)

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    if (scheduleId) {
      const scheduleRows = await sql`
        SELECT id, amount, paid_amount, status
        FROM sale_payment_schedules
        WHERE id = ${scheduleId}
          AND sale_id = ${saleId}
          AND is_active = true
        LIMIT 1
      `

      if (scheduleRows.length === 0) {
        return NextResponse.json({ error: "Payment schedule not found" }, { status: 404 })
      }

      const schedule = scheduleRows[0]
      const remaining = Number(schedule.amount) - Number(schedule.paid_amount || 0)

      if (remaining <= 0) {
        return NextResponse.json({ error: "This schedule is already fully paid" }, { status: 409 })
      }

      if (paymentAmount > remaining) {
        return NextResponse.json(
          { error: `Payment amount exceeds remaining balance (${remaining.toFixed(2)})` },
          { status: 400 }
        )
      }

      const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0]
      const duplicateRows = await sql`
        SELECT id, receipt_no
        FROM sale_payments
        WHERE sale_id = ${saleId}
          AND schedule_id = ${scheduleId}
          AND payment_date = ${paymentDate}
          AND amount = ${paymentAmount}
          AND is_active = true
          AND status NOT IN ('bounced', 'cancelled')
          AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '2 minutes')
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (duplicateRows.length > 0) {
        return NextResponse.json(
          {
            error: `Duplicate payment prevented. Existing receipt: ${duplicateRows[0].receipt_no}`,
            existingPaymentId: duplicateRows[0].id,
            duplicatePrevented: true,
          },
          { status: 409 }
        )
      }
    }

    // Generate receipt number
    const receiptNoResult = await sql`SELECT generate_receipt_no() as receipt_no`
    const receiptNo = receiptNoResult[0]?.receipt_no || `RCP-${Date.now()}`

    // Get sale details for validation and SMS
    const saleResult = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        p.project_name,
        pr.product_name,
        pr.unit_no
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.id = ${saleId}
    `

    if (saleResult.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const sale = saleResult[0]

    // Create payment record
    const result = await sql`
      INSERT INTO sale_payments (
        receipt_no, sale_id, customer_id, schedule_id,
        payment_date, amount, payment_method,
        bank_cash_id, cheque_number, cheque_date, cheque_bank,
        transaction_reference, status, remarks, received_by
      ) VALUES (
        ${receiptNo},
        ${saleId},
        ${sale.customer_id},
        ${scheduleId},
        ${data.paymentDate || new Date().toISOString().split('T')[0]},
        ${paymentAmount},
        ${data.paymentMethod || 'cash'},
        ${data.bankCashId || null},
        ${data.chequeNumber || null},
        ${data.chequeDate || null},
        ${data.chequeBank || null},
        ${data.transactionReference || null},
        ${data.status || 'received'},
        ${data.remarks || null},
        ${data.receivedBy || null}
      )
      RETURNING *
    `

    const payment = result[0]

    // Keep schedules/sales consistent even if DB triggers are missing.
    if (scheduleId) {
      await sql`
        UPDATE sale_payment_schedules sps
        SET
          paid_amount = paid.total_paid,
          status = CASE
            WHEN paid.total_paid >= sps.amount THEN 'paid'
            WHEN paid.total_paid > 0 THEN 'partial'
            WHEN sps.due_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END,
          updated_at = CURRENT_TIMESTAMP
        FROM (
          SELECT COALESCE(SUM(sp.amount), 0) AS total_paid
          FROM sale_payments sp
          WHERE sp.schedule_id = ${scheduleId}
            AND sp.is_active = true
            AND sp.status NOT IN ('bounced', 'cancelled')
        ) paid
        WHERE sps.id = ${scheduleId}
      `
    }

    await sql`
      UPDATE sales s
      SET
        total_paid = totals.total_paid,
        outstanding_amount = s.net_price - totals.total_paid,
        updated_at = CURRENT_TIMESTAMP
      FROM (
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM sale_payments
        WHERE sale_id = ${saleId}
          AND is_active = true
          AND status NOT IN ('bounced', 'cancelled')
      ) totals
      WHERE s.id = ${saleId}
    `
    // Log activity - skip performed_by since user.id is UUID and column expects integer
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${saleId}, 'payment_received', 
        ${'Payment of ' + data.amount + ' received via ' + (data.paymentMethod || 'cash') + '. Receipt: ' + receiptNo}
      )
    `

    // Create accounting voucher if auto_create_voucher is enabled
    const settings = await sql`SELECT auto_create_voucher FROM settings LIMIT 1`
    if (settings[0]?.auto_create_voucher && data.bankCashId) {
      // Create Credit Voucher (Bank/Cash Dr, Sales/Receivable Cr)
      const voucherNoResult = await sql`
        SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_no 
        FROM vouchers
        WHERE voucher_type = 'Credit'
      `
      const voucherNo = buildVoucherNo('Credit', Number(voucherNoResult[0].next_no))

      const voucher = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, bank_cash_id,
          date, amount, particulars, is_confirmed
        ) VALUES (
          ${voucherNo}, 'Credit', ${sale.project_id}, ${data.bankCashId},
          ${data.paymentDate || new Date().toISOString().split('T')[0]},
          ${paymentAmount},
          ${'Payment received from ' + sale.customer_name + ' for ' + sale.product_name + ' - ' + receiptNo},
          true
        )
        RETURNING id
      `

      // Link voucher to payment
      await sql`
        UPDATE sale_payments 
        SET voucher_id = ${voucher[0].id}
        WHERE id = ${payment.id}
      `
    }

    // Send SMS notification if enabled
    if (data.sendSMS !== false) {
      try {
        const updatedSale = await sql`
          SELECT outstanding_amount FROM sales WHERE id = ${saleId}
        `
        
        await sendSMS({
          templateType: 'payment_received',
          phone: sale.customer_phone,
          variables: {
            customer_name: sale.customer_name,
            amount: paymentAmount.toLocaleString(),
            unit_name: sale.product_name + (sale.unit_no ? ' (' + sale.unit_no + ')' : ''),
            receipt_no: receiptNo,
            outstanding: (updatedSale[0]?.outstanding_amount || 0).toLocaleString()
          },
          referenceType: 'payment',
          referenceId: payment.id
        })
      } catch (smsError) {
        console.error("SMS sending failed:", smsError)
        // Don't fail the payment if SMS fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      payment: result[0],
      receiptNo: receiptNo,
      message: "Payment recorded successfully"
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
