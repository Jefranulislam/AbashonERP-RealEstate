import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-access"
import { ensureVoucherPaymentSchema } from "@/lib/voucher-schema"

// PUT - Update an existing voucher (Credit/Debit fields)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureVoucherPaymentSchema()

    const { id } = await params
    const data = await request.json()

    const existing = await sql`SELECT id FROM vouchers WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 })
    }

    const vendorId = Number(data.vendorId) > 0 ? Number(data.vendorId) : null
    const constructorId = Number(data.constructorId) > 0 ? Number(data.constructorId) : null
    const referencePartyName = data.referencePartyName?.trim() || null
    const referencePartyType = referencePartyName ? (data.referencePartyType || "OTHER") : null

    const result = await sql`
      UPDATE vouchers
      SET
        project_id = ${data.projectId},
        expense_head_id = ${data.expenseHeadId},
        bank_cash_id = ${data.bankCashId},
        bill_no = ${data.billNo || null},
        date = ${data.date},
        amount = ${data.amount},
        particulars = ${data.particulars || null},
        payment_method = ${data.paymentMethod || null},
        cheque_number = ${data.chequeNumber || null},
        cheque_date = ${data.chequeDate || null},
        is_confirmed = ${data.isConfirmed === true},
        vendor_id = ${vendorId},
        constructor_id = ${constructorId},
        vendor_name = ${data.vendorName || null},
        reference_party_type = ${referencePartyType},
        reference_party_name = ${referencePartyName},
        qty = ${data.qty || null},
        rate = ${data.rate || null},
        inventory = ${data.inventory || null},
        memo = ${data.memo || null},
        account_head_type = ${data.accountHeadType || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, voucher: result[0] })
  } catch (error) {
    console.error("Error updating voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Only Admin can delete vouchers" }, { status: 403 })
    }

    const { id } = await params

    await sql`DELETE FROM vouchers WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
