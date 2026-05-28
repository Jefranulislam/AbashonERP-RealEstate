import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureAccountCodeSchema, getNextAccountCode } from "@/lib/account-code"

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAccountCodeSchema()
    const code = await getNextAccountCode()
    return NextResponse.json({ code })
  } catch (error) {
    console.error("Error generating next account code:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal' }, { status: 500 })
  }
}
