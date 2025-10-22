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
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    console.log("[CRM Reports] Generating reports for date range:", fromDate, "to", toDate)

    // 1. Lead Status Distribution
    const statusDistribution = await sql`
      SELECT 
        COALESCE(leads_status, 'Unspecified') as status,
        COUNT(*) as count
      FROM crm_leads
      WHERE is_active = true
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
      GROUP BY leads_status
      ORDER BY count DESC
    `

    // 2. Lead Source Distribution
    const sourceDistribution = await sql`
      SELECT 
        COALESCE(lead_source, 'Unknown') as source,
        COUNT(*) as count
      FROM crm_leads
      WHERE is_active = true
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
      GROUP BY lead_source
      ORDER BY count DESC
    `

    // 3. Conversion Rate
    const conversionStats = await sql`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE leads_status = 'Positive') as converted_leads
      FROM crm_leads
      WHERE is_active = true
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
    `
    const totalLeads = Number(conversionStats[0].total_leads)
    const convertedLeads = Number(conversionStats[0].converted_leads)
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : "0"

    // 4. Leads by Employee Assignment
    const employeeStats = await sql`
      SELECT 
        e.name as employee_name,
        COUNT(l.id) as lead_count,
        COUNT(*) FILTER (WHERE l.leads_status = 'Positive') as converted_count
      FROM crm_leads l
      LEFT JOIN employees e ON l.assign_to = e.id
      WHERE l.is_active = true
        ${fromDate ? sql`AND l.created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND l.created_at <= ${toDate}` : sql``}
      GROUP BY e.id, e.name
      ORDER BY lead_count DESC
      LIMIT 10
    `

    // 5. Leads by Project
    const projectStats = await sql`
      SELECT 
        COALESCE(project_name, 'No Project') as project,
        COUNT(*) as count
      FROM crm_leads
      WHERE is_active = true
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
      GROUP BY project_name
      ORDER BY count DESC
      LIMIT 10
    `

    // 6. Daily Lead Creation Trend (last 30 days)
    const trendData = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM crm_leads
      WHERE is_active = true
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // 7. Follow-up Stats
    const followupStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE next_call_date = CURRENT_DATE) as today_calls,
        COUNT(*) FILTER (WHERE next_call_date < CURRENT_DATE) as overdue_calls,
        COUNT(*) FILTER (WHERE next_call_date > CURRENT_DATE) as upcoming_calls
      FROM crm_leads
      WHERE is_active = true
        AND next_call_date IS NOT NULL
    `

    // 8. Lead Quality Metrics
    const qualityMetrics = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE leads_status = 'Positive') as positive,
        COUNT(*) FILTER (WHERE leads_status = 'Negative') as negative,
        COUNT(*) FILTER (WHERE leads_status = 'Junk') as junk,
        COUNT(*) FILTER (WHERE leads_status = 'Followup') as followup,
        COUNT(*) FILTER (WHERE leads_status = 'New') as new,
        COUNT(*) FILTER (WHERE leads_status = 'Client will Visit') as will_visit
      FROM crm_leads
      WHERE is_active = true
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
    `

    const response = {
      summary: {
        totalLeads,
        convertedLeads,
        conversionRate: `${conversionRate}%`,
        todayCalls: Number(followupStats[0].today_calls),
        overdueCalls: Number(followupStats[0].overdue_calls),
        upcomingCalls: Number(followupStats[0].upcoming_calls),
      },
      statusDistribution: statusDistribution.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
      sourceDistribution: sourceDistribution.map((row) => ({
        source: row.source,
        count: Number(row.count),
      })),
      employeePerformance: employeeStats.map((row) => ({
        employeeName: row.employee_name || "Unassigned",
        leadCount: Number(row.lead_count),
        convertedCount: Number(row.converted_count),
        conversionRate: row.lead_count > 0 
          ? `${((Number(row.converted_count) / Number(row.lead_count)) * 100).toFixed(2)}%`
          : "0%",
      })),
      projectDistribution: projectStats.map((row) => ({
        project: row.project,
        count: Number(row.count),
      })),
      trendData: trendData.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
      qualityMetrics: {
        positive: Number(qualityMetrics[0].positive),
        negative: Number(qualityMetrics[0].negative),
        junk: Number(qualityMetrics[0].junk),
        followup: Number(qualityMetrics[0].followup),
        new: Number(qualityMetrics[0].new),
        willVisit: Number(qualityMetrics[0].will_visit),
      },
    }

    console.log("[CRM Reports] Reports generated successfully")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[CRM Reports] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
