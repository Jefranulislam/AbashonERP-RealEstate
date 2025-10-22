import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // In production, verify password hash properly (using bcrypt)
    // For now, simple check against database
    const users = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE email = ${email}
      AND deleted_at IS NULL
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // TODO: Add proper password verification using bcrypt
    // For now, accept any password for development

    const user = users[0]

    // Create session (in production, use JWT)
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
    }

    const cookieStore = await cookies()
    cookieStore.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
