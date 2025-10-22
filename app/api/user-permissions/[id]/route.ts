import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number.parseInt(params.id)
    const data = await request.json()
    const res = await sql`UPDATE user_permissions SET phone = ${data.phone || null}, category = ${data.category || null} WHERE id = ${id} RETURNING *`
    return NextResponse.json({ userPermission: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number.parseInt(params.id)
    await sql`DELETE FROM user_permissions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
