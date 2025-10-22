import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter")
    const search = searchParams.get("search")

    console.log("[v0] Fetching leads with filter:", filter, "search:", search)

    let leads

    // Base query with joins
    if (filter === "today_call") {
      if (search) {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date = CURRENT_DATE
            AND (l.customer_name ILIKE ${'%' + search + '%'} OR l.phone ILIKE ${'%' + search + '%'} OR l.crm_id ILIKE ${'%' + search + '%'})
          ORDER BY l.created_at DESC
        `
      } else {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date = CURRENT_DATE
          ORDER BY l.created_at DESC
        `
      }
    } else if (filter === "pending_call") {
      if (search) {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date < CURRENT_DATE
            AND (l.customer_name ILIKE ${'%' + search + '%'} OR l.phone ILIKE ${'%' + search + '%'} OR l.crm_id ILIKE ${'%' + search + '%'})
          ORDER BY l.created_at DESC
        `
      } else {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date < CURRENT_DATE
          ORDER BY l.created_at DESC
        `
      }
    } else if (filter === "today_followup") {
      if (search) {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date = CURRENT_DATE 
            AND l.leads_status = 'Followup'
            AND (l.customer_name ILIKE ${'%' + search + '%'} OR l.phone ILIKE ${'%' + search + '%'} OR l.crm_id ILIKE ${'%' + search + '%'})
          ORDER BY l.created_at DESC
        `
      } else {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND l.next_call_date = CURRENT_DATE 
            AND l.leads_status = 'Followup'
          ORDER BY l.created_at DESC
        `
      }
    } else {
      // No filter
      if (search) {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
            AND (l.customer_name ILIKE ${'%' + search + '%'} OR l.phone ILIKE ${'%' + search + '%'} OR l.crm_id ILIKE ${'%' + search + '%'})
          ORDER BY l.created_at DESC
        `
      } else {
        leads = await sql`
          SELECT 
            l.*,
            e1.name as assign_to_name,
            e2.name as assigned_by_name
          FROM crm_leads l
          LEFT JOIN employees e1 ON l.assign_to = e1.id
          LEFT JOIN employees e2 ON l.assigned_by = e2.id
          WHERE l.is_active = true
          ORDER BY l.created_at DESC
        `
      }
    }

    console.log("[v0] Leads fetched:", leads.length)

    return NextResponse.json({ leads })
  } catch (error) {
    console.error("[v0] Error fetching leads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("[v0] Received lead data:", data)

    // Generate CRM ID
    const crmIdResult = await sql`SELECT COUNT(*) as count FROM crm_leads`
    const count = Number(crmIdResult[0].count) + 1
    const crmId = `CRM${String(count).padStart(6, "0")}`

    const result = await sql`
      INSERT INTO crm_leads (
        crm_id, profession, customer_name, leads_status, lead_source,
        phone, whatsapp, email, nid, project_name, assign_to, assigned_by,
        next_call_date, father_or_husband_name, mailing_address, 
        permanent_address, birth_date
      ) VALUES (
        ${crmId}, 
        ${data.profession || null}, 
        ${data.customerName}, 
        ${data.leadsStatus || null},
        ${data.leadSource || null}, 
        ${data.phone}, 
        ${data.whatsapp || null}, 
        ${data.email || null},
        ${data.nid || null}, 
        ${data.projectName || null}, 
        ${data.assignTo ? Number.parseInt(data.assignTo) : null}, 
        ${data.assignedBy ? Number.parseInt(data.assignedBy) : null},
        ${data.nextCallDate || null}, 
        ${data.fatherOrHusbandName || null}, 
        ${data.mailingAddress || null},
        ${data.permanentAddress || null}, 
        ${data.birthDate || null}
      )
      RETURNING *
    `

    console.log("[v0] Lead created:", result[0])
    return NextResponse.json({ success: true, lead: result[0] })
  } catch (error) {
    console.error("[v0] Error creating lead:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
