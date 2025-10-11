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

    const result = await sql`
      UPDATE purchase_requisitions
      SET is_confirmed = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, requisition: result[0] })
  } catch (error) {
    console.error("[v0] Error confirming requisition:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
