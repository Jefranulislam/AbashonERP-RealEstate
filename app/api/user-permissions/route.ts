import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT up.*, u.email FROM user_permissions up LEFT JOIN users u ON u.id::text = up.user_id ORDER BY up.created_at DESC`
    return NextResponse.json({ userPermissions: res })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = await request.json()
    const res = await sql`INSERT INTO user_permissions (user_id, phone, category, can_access_project, can_access_products) VALUES (${data.userId}, ${data.phone || null}, ${data.category || null}, ${data.canAccessProject || false}, ${data.canAccessProducts || false}) RETURNING *`
    return NextResponse.json({ userPermission: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
