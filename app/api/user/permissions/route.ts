import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserPermissions } from "@/lib/permissions"

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const permissions = await getUserPermissions(user.id)

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("[API] Error fetching user permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
