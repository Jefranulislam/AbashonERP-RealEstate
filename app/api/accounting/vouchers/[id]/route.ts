import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-access"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Only Admin can delete vouchers" }, { status: 403 })
    }

    const { id } = await params

    await sql`DELETE FROM vouchers WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting voucher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
