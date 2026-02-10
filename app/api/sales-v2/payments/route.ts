import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sendSMS } from "@/lib/sms-service"

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
      WHERE s.id = ${data.saleId}
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
        ${data.saleId},
        ${sale.customer_id},
        ${data.scheduleId || null},
        ${data.paymentDate || new Date().toISOString().split('T')[0]},
        ${parseFloat(data.amount)},
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

    // Log activity - skip performed_by since user.id is UUID and column expects integer
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${data.saleId}, 'payment_received', 
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
      `
      const voucherNo = `CV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(voucherNoResult[0].next_no).padStart(4, '0')}`

      const voucher = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, bank_cash_id,
          date, amount, particulars, is_confirmed
        ) VALUES (
          ${voucherNo}, 'Credit', ${sale.project_id}, ${data.bankCashId},
          ${data.paymentDate || new Date().toISOString().split('T')[0]},
          ${parseFloat(data.amount)},
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
          SELECT outstanding_amount FROM sales WHERE id = ${data.saleId}
        `
        
        await sendSMS({
          templateType: 'payment_received',
          phone: sale.customer_phone,
          variables: {
            customer_name: sale.customer_name,
            amount: parseFloat(data.amount).toLocaleString(),
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
