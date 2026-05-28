import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-access"

type ActionName = "delete_all_vouchers" | "delete_project_vouchers" | "cancel_all_sale_payments"

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await isAdminUser(user.id)
    return NextResponse.json({
      isAdmin: admin,
      actions: admin
        ? [
            { key: "delete_all_vouchers", label: "Delete All Vouchers" },
            { key: "delete_project_vouchers", label: "Delete Project Vouchers" },
            { key: "cancel_all_sale_payments", label: "Cancel All Sale Payments" },
          ]
        : [],
    })
  } catch (error) {
    console.error("[Admin Actions] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await isAdminUser(user.id)
    if (!admin) {
      return NextResponse.json({ error: "Only Admin can run this action" }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body.action || "") as ActionName
    const confirmText = String(body.confirmText || "")

    if (confirmText !== "CONFIRM DELETE") {
      return badRequest("Type CONFIRM DELETE to execute this action")
    }

    if (action === "delete_all_vouchers") {
      try {
        const countRows = await sql`SELECT COUNT(*)::int AS count FROM vouchers`
        const total = Number(countRows[0]?.count || 0)

        // Delete in correct order to avoid FK constraint issues
        await sql`DELETE FROM payment_history`
        await sql`DELETE FROM sale_payments WHERE voucher_id IS NOT NULL`
        await sql`DELETE FROM payment_transactions WHERE voucher_id IS NOT NULL`
        await sql`DELETE FROM journal_voucher_details`
        await sql`DELETE FROM vouchers`

        return NextResponse.json({
          success: true,
          action,
          message: "All vouchers deleted",
          details: { deletedVouchers: total },
        })
      } catch (error) {
        console.error("[Admin Actions] Delete all vouchers error:", error)
        throw error
      }
    }

    if (action === "delete_project_vouchers") {
      try {
        const projectId = Number(body.projectId)
        if (!projectId) return badRequest("projectId is required")

        const projectRows = await sql`SELECT project_name FROM projects WHERE id = ${projectId} LIMIT 1`
        if (projectRows.length === 0) return badRequest("Project not found")

        const countRows = await sql`
          SELECT COUNT(*)::int AS count
          FROM vouchers
          WHERE project_id = ${projectId}
        `
        const total = Number(countRows[0]?.count || 0)

        // Delete dependent records for this project's vouchers
        await sql`DELETE FROM sale_payments WHERE voucher_id IN (SELECT id FROM vouchers WHERE project_id = ${projectId})`
        await sql`DELETE FROM payment_transactions WHERE voucher_id IN (SELECT id FROM vouchers WHERE project_id = ${projectId})`
        await sql`DELETE FROM journal_voucher_details WHERE voucher_id IN (SELECT id FROM vouchers WHERE project_id = ${projectId})`
        await sql`DELETE FROM vouchers WHERE project_id = ${projectId}`

        return NextResponse.json({
          success: true,
          action,
          message: "Project vouchers deleted",
          details: {
            projectId,
            projectName: projectRows[0].project_name,
            deletedVouchers: total,
          },
        })
      } catch (error) {
        console.error("[Admin Actions] Delete project vouchers error:", error)
        throw error
      }
    }

    if (action === "cancel_all_sale_payments") {
      const countRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM sale_payments
        WHERE is_active = true
      `
      const total = Number(countRows[0]?.count || 0)

      await sql`
        UPDATE sale_payments
        SET
          status = 'cancelled',
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE is_active = true
      `

      await sql`
        UPDATE sale_payment_schedules sps
        SET
          paid_amount = COALESCE(x.total_paid, 0),
          status = CASE
            WHEN COALESCE(x.total_paid, 0) >= sps.amount THEN 'paid'
            WHEN COALESCE(x.total_paid, 0) > 0 THEN 'partial'
            WHEN sps.due_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END,
          updated_at = CURRENT_TIMESTAMP
        FROM (
          SELECT schedule_id, SUM(amount) AS total_paid
          FROM sale_payments
          WHERE is_active = true
            AND status NOT IN ('bounced', 'cancelled')
            AND schedule_id IS NOT NULL
          GROUP BY schedule_id
        ) x
        WHERE sps.id = x.schedule_id
      `

      await sql`
        UPDATE sale_payment_schedules sps
        SET
          paid_amount = 0,
          status = CASE
            WHEN sps.due_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
          SELECT 1
          FROM sale_payments sp
          WHERE sp.schedule_id = sps.id
            AND sp.is_active = true
            AND sp.status NOT IN ('bounced', 'cancelled')
        )
      `

      await sql`
        UPDATE sales s
        SET
          total_paid = COALESCE(x.total_paid, 0),
          outstanding_amount = s.net_price - COALESCE(x.total_paid, 0),
          updated_at = CURRENT_TIMESTAMP
        FROM (
          SELECT sale_id, SUM(amount) AS total_paid
          FROM sale_payments
          WHERE is_active = true
            AND status NOT IN ('bounced', 'cancelled')
          GROUP BY sale_id
        ) x
        WHERE s.id = x.sale_id
      `

      await sql`
        UPDATE sales s
        SET
          total_paid = 0,
          outstanding_amount = s.net_price,
          updated_at = CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
          SELECT 1
          FROM sale_payments sp
          WHERE sp.sale_id = s.id
            AND sp.is_active = true
            AND sp.status NOT IN ('bounced', 'cancelled')
        )
      `

      return NextResponse.json({
        success: true,
        action,
        message: "All sale payments cancelled and balances recalculated",
        details: { cancelledPayments: total },
      })
    }

    return badRequest("Unknown action")
  } catch (error) {
    console.error("[Admin Actions] POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
