import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    console.log("[v0] Updating lead:", id, "with data:", data)

    const result = await sql`
      UPDATE crm_leads
      SET 
        profession = ${data.profession || null},
        customer_name = ${data.customerName},
        leads_status = ${data.leadsStatus || null},
        lead_source = ${data.leadSource || null},
        phone = ${data.phone},
        whatsapp = ${data.whatsapp || null},
        email = ${data.email || null},
        nid = ${data.nid || null},
        project_name = ${data.projectName || null},
        assign_to = ${data.assignTo ? Number.parseInt(data.assignTo) : null},
        assigned_by = ${data.assignedBy ? Number.parseInt(data.assignedBy) : null},
        next_call_date = ${data.nextCallDate || null},
        father_or_husband_name = ${data.fatherOrHusbandName || null},
        mailing_address = ${data.mailingAddress || null},
        permanent_address = ${data.permanentAddress || null},
        birth_date = ${data.birthDate || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    console.log("[v0] Lead updated:", result[0])
    return NextResponse.json({ success: true, lead: result[0] })
  } catch (error) {
    console.error("[v0] Error updating lead:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`
      UPDATE crm_leads
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting lead:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
