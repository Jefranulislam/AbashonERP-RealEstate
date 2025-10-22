import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leads } = await request.json()
    console.log("[CRM Import] Received leads:", leads?.length)

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 })
    }

    const results = []
    const errors = []

    // Get current count for CRM ID generation
    const crmIdResult = await sql`SELECT COUNT(*) as count FROM crm_leads`
    let count = Number(crmIdResult[0].count)

    for (const [index, leadData] of leads.entries()) {
      try {
        // Validate required fields
        if (!leadData.customerName || !leadData.phone) {
          errors.push({
            row: index + 1,
            error: "Missing required fields (customerName or phone)",
            data: leadData,
          })
          continue
        }

        // Generate CRM ID
        count++
        const crmId = `CRM${String(count).padStart(6, "0")}`

        const result = await sql`
          INSERT INTO crm_leads (
            crm_id, profession, customer_name, leads_status, lead_source,
            phone, whatsapp, email, nid, project_name, assign_to, assigned_by,
            next_call_date, father_or_husband_name, mailing_address, 
            permanent_address, birth_date
          ) VALUES (
            ${crmId}, 
            ${leadData.profession || null}, 
            ${leadData.customerName}, 
            ${leadData.leadsStatus || null},
            ${leadData.leadSource || null}, 
            ${leadData.phone}, 
            ${leadData.whatsapp || null}, 
            ${leadData.email || null},
            ${leadData.nid || null}, 
            ${leadData.projectName || null}, 
            ${leadData.assignTo ? Number.parseInt(leadData.assignTo) : null}, 
            ${leadData.assignedBy ? Number.parseInt(leadData.assignedBy) : null},
            ${leadData.nextCallDate || null}, 
            ${leadData.fatherOrHusbandName || null}, 
            ${leadData.mailingAddress || null},
            ${leadData.permanentAddress || null}, 
            ${leadData.birthDate || null}
          )
          RETURNING *
        `

        results.push(result[0])
      } catch (error: any) {
        console.error("[CRM Import] Error importing lead at row", index + 1, error)
        errors.push({
          row: index + 1,
          error: error.message,
          data: leadData,
        })
      }
    }

    console.log(
      "[CRM Import] Import completed:",
      results.length,
      "successful,",
      errors.length,
      "failed"
    )

    return NextResponse.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[CRM Import] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
