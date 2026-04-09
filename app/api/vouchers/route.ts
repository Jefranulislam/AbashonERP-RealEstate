// app/api/vouchers/route.ts - API to fetch vouchers for PDF generation
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const vouchers = await sql`
      SELECT 
        v.id,
        v.voucher_no,
        v.voucher_type,
        v.amount,
        v.date,
        v.particulars,
        COALESCE(
          pt.payment_method,
          CASE v.voucher_type 
            WHEN 'Credit' then 'Cash'
            ELSE 'Bank Transfer'
          END
        ) as payment_method,
        COALESCE(
          ven.name,
          cust.name,
          proj.name
        ) as party_name,
        CASE 
          WHEN ven.name IS NOT NULL THEN 'vendor'
          WHEN cust.name IS NOT NULL THEN 'customer'  
          ELSE 'project'
        END as party_type,
        proj.name as project_name
      FROM vouchers v
      LEFT JOIN payment_transactions pt ON pt.voucher_id = v.id
      LEFT JOIN vendors ven ON ven.id = pt.vendor_id
      LEFT JOIN customers cust ON cust.id = pt.customer_id  
      LEFT JOIN projects proj ON proj.id = v.project_id
      WHERE v.is_confirmed = true
      ORDER BY v.created_at DESC
      LIMIT 100
    `

    const processedVouchers = vouchers.map(voucher => ({
      id: voucher.id,
      voucher_no: voucher.voucher_no,
      voucher_type: voucher.voucher_type,
      amount: voucher.amount,
      date: voucher.date,
      particulars: voucher.particulars || 'No description provided',
      payment_method: voucher.payment_method || 'Cash',
      vendor_name: voucher.party_type === 'vendor' ? voucher.party_name : null,
      customer_name: voucher.party_type === 'customer' ? voucher.party_name : null,
      project_name: voucher.project_name
    }))

    return NextResponse.json(processedVouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}