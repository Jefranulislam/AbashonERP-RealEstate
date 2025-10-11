import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get lead data
    const leads = await sql`
      SELECT * FROM crm_leads WHERE id = ${id} LIMIT 1
    `

    if (leads.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const lead = leads[0]

    // Generate Customer ID
    const customerIdResult = await sql`SELECT COUNT(*) as count FROM customers`
    const count = Number(customerIdResult[0].count) + 1
    const customerId = `CUST${String(count).padStart(6, "0")}`

    // Create customer from lead
    const result = await sql`
      INSERT INTO customers (
        customer_id, profession, customer_name, father_or_husband_name,
        phone, whatsapp, nid, email, mailing_address, permanent_address,
        birth_date, crm_id, converted_from
      ) VALUES (
        ${customerId}, ${lead.profession}, ${lead.customer_name}, 
        ${lead.father_or_husband_name}, ${lead.phone}, ${lead.whatsapp},
        ${lead.nid}, ${lead.email}, ${lead.mailing_address}, 
        ${lead.permanent_address}, ${lead.birth_date}, ${lead.crm_id}, ${id}
      )
      RETURNING *
    `

    // Mark lead as converted
    await sql`
      UPDATE crm_leads
      SET leads_status = 'Converted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true, customer: result[0] })
  } catch (error) {
    console.error("[v0] Error converting lead:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
