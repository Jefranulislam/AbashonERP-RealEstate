import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await sql`
      SELECT * FROM settings ORDER BY id DESC LIMIT 1
    `

    return NextResponse.json({ settings: settings[0] || null })
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      company_name,
      invoice_prefix,
      address,
      payment_methods,
      lead_status,
      lead_source,
      print_on_company_pad,
      currency_code,
      currency_symbol,
    } = body

    // Check if settings exist
    const existingSettings = await sql`
      SELECT id FROM settings ORDER BY id DESC LIMIT 1
    `

    let result
    if (existingSettings.length > 0) {
      // Update existing settings
      result = await sql`
        UPDATE settings
        SET
          company_name = ${company_name},
          invoice_prefix = ${invoice_prefix},
          address = ${address},
          payment_methods = ${payment_methods},
          lead_status = ${lead_status},
          lead_source = ${lead_source},
          print_on_company_pad = ${print_on_company_pad === 'Yes' || print_on_company_pad === true},
          currency_code = ${currency_code || 'BDT'},
          currency_symbol = ${currency_symbol || '৳'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingSettings[0].id}
        RETURNING *
      `
    } else {
      // Insert new settings
      result = await sql`
        INSERT INTO settings (
          company_name,
          invoice_prefix,
          address,
          payment_methods,
          lead_status,
          lead_source,
          print_on_company_pad,
          currency_code,
          currency_symbol
        )
        VALUES (
          ${company_name},
          ${invoice_prefix},
          ${address},
          ${payment_methods},
          ${lead_status},
          ${lead_source},
          ${print_on_company_pad === 'Yes' || print_on_company_pad === true},
          ${currency_code || 'BDT'},
          ${currency_symbol || '৳'}
        )
        RETURNING *
      `
    }

    return NextResponse.json({
      success: true,
      settings: result[0],
    })
  } catch (error) {
    console.error("[v0] Error saving settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
