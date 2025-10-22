import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const res = await sql`SELECT * FROM income_expense_types WHERE is_active = true ORDER BY created_at DESC`
    return NextResponse.json({ types: res })
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
    if (!data || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    const isActive = data.isActive === undefined ? true : !!data.isActive
    const res = await sql`INSERT INTO income_expense_types (name, is_active) VALUES (${data.name}, ${isActive}) RETURNING id, name, is_active, created_at`
    return NextResponse.json({ type: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
