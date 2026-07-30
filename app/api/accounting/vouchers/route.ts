import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { buildVoucherNo, normalizeVoucherType } from "@/lib/voucher-utils"
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
    const voucherType = searchParams.get("voucherType")
    const normalizedVoucherType = voucherType ? normalizeVoucherType(voucherType) : null

    console.log("Fetching vouchers with projectId:", projectId, "voucherType:", voucherType)

    const vouchers = await sql`
      SELECT
        v.*,
        CASE
          WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE v.voucher_type
        END as voucher_type,
        p.project_name,
        p.address as project_address,
        COALESCE(ieh.head_name, NULLIF(TRIM(v.account_head_type), '')) as expense_head_name,
        ieh.account_code as expense_head_code,
        bc.account_title as bank_cash_name,
        dr_bc.account_title as dr_bank_cash_name,
        cr_bc.account_title as cr_bank_cash_name,
        COALESCE(NULLIF(TRIM(v.vendor_name), ''), ve.vendor_name, co.constructor_name, v.reference_party_name) as vendor_display_name,
        ve.vendor_code,
        ve.contact_person as vendor_contact_person,
        COALESCE(ve.mailing_address, co.mailing_address) as vendor_address,
        COALESCE(ve.phone, co.phone) as vendor_phone,
        COALESCE(ve.email, co.email) as vendor_email,
        co.constructor_name,
        CASE WHEN v.constructor_id IS NOT NULL AND v.vendor_id IS NULL THEN 'Contractor' ELSE 'Vendor' END as party_type,
        -- Purchase Order linked through payment_transactions (vouchers have no po_id)
        (
          SELECT po.po_number
          FROM payment_transactions pt
          JOIN purchase_orders po ON pt.po_id = po.id
          WHERE pt.voucher_id = v.id
          LIMIT 1
        ) as po_number,
        -- All payment records against the same PO (partial payments), or the
        -- voucher's own linked payment when there is no PO.
        (
          SELECT json_agg(json_build_object(
            'payment_number', pt2.payment_number,
            'payment_date', pt2.payment_date,
            'payment_method', pt2.payment_method,
            'bank_name', COALESCE(bca2.account_title, pt2.bank_name),
            'cheque_number', pt2.cheque_number,
            'cheque_date', pt2.cheque_date,
            'reference', pt2.transaction_reference,
            'amount', pt2.amount
          ) ORDER BY pt2.payment_date, pt2.id)
          FROM payment_transactions pt2
          LEFT JOIN bank_cash_accounts bca2 ON pt2.bank_account_id = bca2.id
          WHERE pt2.is_active = true
            AND (
              pt2.voucher_id = v.id
              OR pt2.po_id = (
                SELECT pt3.po_id FROM payment_transactions pt3
                WHERE pt3.voucher_id = v.id AND pt3.po_id IS NOT NULL
                LIMIT 1
              )
            )
        ) as payment_records
      FROM vouchers v
      LEFT JOIN projects p ON v.project_id = p.id
      LEFT JOIN income_expense_heads ieh ON v.expense_head_id = ieh.id
      LEFT JOIN bank_cash_accounts bc ON v.bank_cash_id = bc.id
      LEFT JOIN bank_cash_accounts dr_bc ON v.dr_bank_cash_id = dr_bc.id
      LEFT JOIN bank_cash_accounts cr_bc ON v.cr_bank_cash_id = cr_bc.id
      LEFT JOIN vendors ve ON v.vendor_id = ve.id
      LEFT JOIN constructors co ON v.constructor_id = co.id
      WHERE 1=1
        ${projectId ? sql`AND v.project_id = ${projectId}` : sql``}
        ${normalizedVoucherType ? sql`
          AND CASE
            WHEN LOWER(TRIM(v.voucher_type)) IN ('credit', 'cr') THEN 'Credit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
            WHEN LOWER(TRIM(v.voucher_type)) IN ('contra', 'cv') THEN 'Contra'
            ELSE v.voucher_type
          END = ${normalizedVoucherType}` : sql``}
      ORDER BY v.date DESC, v.created_at DESC
    `

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error("Error fetching vouchers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureVoucherPaymentSchema()

    const data = await request.json()

    const normalizedType = normalizeVoucherType(data.voucherType)
    if (!normalizedType) {
      return NextResponse.json({ error: "Invalid voucher type" }, { status: 400 })
    }

    // Generate voucher number
    const voucherResult = await sql`
      SELECT COUNT(*) as count
      FROM vouchers
      WHERE CASE
        WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
        WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
        WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
        WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
        ELSE voucher_type
      END = ${normalizedType}
    `
    const count = Number(voucherResult[0].count) + 1
    const voucherNo = buildVoucherNo(normalizedType, count)

    // Handle Contra vouchers differently (they have dr_bank_cash_id and cr_bank_cash_id)
    if (normalizedType === "Contra") {
      const result = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, dr_bank_cash_id, cr_bank_cash_id,
          date, amount, description, cheque_number, is_confirmed
        ) VALUES (
          ${voucherNo}, ${normalizedType}, ${data.projectId}, ${data.drBankCashId},
          ${data.crBankCashId}, ${data.date}, ${data.amount}, ${data.description},
          ${data.chequeNumber}, ${data.isConfirmed}
        )
        RETURNING *
      `

      return NextResponse.json({ success: true, voucher: result[0] })
    }

    // Journal voucher: create header and two detail lines (Dr and Cr)
    if (normalizedType === "Journal") {
      const drProjectId = Number(data.drProjectId)
      const crProjectId = Number(data.crProjectId)
      const drExpenseHeadId = Number(data.drExpenseHeadId)
      const crExpenseHeadId = Number(data.crExpenseHeadId)
      const drAmount = Number(data.drAmount)
      const crAmount = Number(data.crAmount)

      if (!drProjectId || !crProjectId || !drExpenseHeadId || !crExpenseHeadId) {
        return NextResponse.json({ error: "Journal debit/credit accounts are required" }, { status: 400 })
      }

      if (!Number.isFinite(drAmount) || !Number.isFinite(crAmount) || drAmount <= 0 || crAmount <= 0) {
        return NextResponse.json({ error: "Journal debit/credit amounts must be greater than zero" }, { status: 400 })
      }

      if (Math.abs(drAmount - crAmount) > 0.0001) {
        return NextResponse.json({ error: "Debit and credit amounts must be equal" }, { status: 400 })
      }

      const headerProjectId = drProjectId || crProjectId
      const journalAmount = drAmount

      const voucherInsert = await sql`
        INSERT INTO vouchers (
          voucher_no, voucher_type, project_id, bill_no,
          date, amount, particulars, is_confirmed
        ) VALUES (
          ${voucherNo}, ${normalizedType}, ${headerProjectId}, ${data.billNo || null},
          ${data.date}, ${journalAmount}, ${data.description || data.particulars || null}, ${data.isConfirmed}
        )
        RETURNING *
      `

      const voucher = voucherInsert[0]

      await sql`
        INSERT INTO journal_voucher_details (
          voucher_id, project_id, expense_head_id, debit_amount, credit_amount
        ) VALUES
          (${voucher.id}, ${drProjectId}, ${drExpenseHeadId}, ${drAmount}, 0),
          (${voucher.id}, ${crProjectId}, ${crExpenseHeadId}, 0, ${crAmount})
      `

      return NextResponse.json({ success: true, voucher })
    }

    // Regular vouchers (Credit, Debit)
    const vendorId = Number(data.vendorId) > 0 ? Number(data.vendorId) : null
    const constructorId = Number(data.constructorId) > 0 ? Number(data.constructorId) : null
    const referencePartyName = data.referencePartyName?.trim() || null
    const referencePartyType = referencePartyName ? (data.referencePartyType || "OTHER") : null
    const result = await sql`
      INSERT INTO vouchers (
        voucher_no, voucher_type, project_id, expense_head_id, bank_cash_id,
        bill_no, date, amount, particulars, cheque_number, cheque_date,
        payment_method, is_confirmed, vendor_id, constructor_id, vendor_name,
        reference_party_type, reference_party_name,
        qty, rate, inventory, memo, account_head_type
      ) VALUES (
        ${voucherNo}, ${normalizedType}, ${data.projectId}, ${data.expenseHeadId},
        ${data.bankCashId}, ${data.billNo}, ${data.date}, ${data.amount},
        ${data.particulars}, ${data.chequeNumber || null}, ${data.chequeDate || null},
        ${data.paymentMethod || null}, ${data.isConfirmed}, ${vendorId}, ${constructorId}, ${data.vendorName || null},
        ${referencePartyType}, ${referencePartyName},
        ${data.qty || null}, ${data.rate || null},
        ${data.inventory || null}, ${data.memo || null}, ${data.accountHeadType || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, voucher: result[0] })
  } catch (error) {
    console.error("Error creating voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
