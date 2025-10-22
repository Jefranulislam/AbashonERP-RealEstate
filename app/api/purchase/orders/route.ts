import { NextResponse } from "next/server"

export async function GET() {
  // Placeholder: returns empty list for now
  return NextResponse.json({ orders: [] })
}
