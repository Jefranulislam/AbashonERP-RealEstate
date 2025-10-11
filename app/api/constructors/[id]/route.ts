import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const id = Number.parseInt(params.id)

    const result = await sql`
      UPDATE constructors SET
        constructor_name = ${data.constructorName},
        mailing_address = ${data.mailingAddress || null},
        website = ${data.website || null},
        phone = ${data.phone || null},
        email = ${data.email || null},
        description = ${data.description || null},
        is_active = ${data.isActive}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, constructor: result[0] })
  } catch (error) {
    console.error("[v0] Error updating constructor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    await sql`DELETE FROM constructors WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting constructor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
