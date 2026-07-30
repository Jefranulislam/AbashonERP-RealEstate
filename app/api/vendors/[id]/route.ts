import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureVoucherPaymentSchema } from "@/lib/voucher-schema"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureVoucherPaymentSchema()

    const { id } = await params
    const data = await request.json()

    const result = await sql`
      UPDATE vendors
      SET
        vendor_name = ${data.vendorName},
        contact_person = ${data.contactPerson || null},
        mailing_address = ${data.mailingAddress},
        website = ${data.website},
        phone = ${data.phone},
        email = ${data.email},
        description = ${data.description},
        bank_name = ${data.bankName || null},
        bank_account_number = ${data.bankAccountNumber || null},
        bank_account_name = ${data.bankAccountName || null},
        bank_branch = ${data.bankBranch || null},
        bank_routing_number = ${data.bankRoutingNumber || null},
        bank_swift_code = ${data.bankSwiftCode || null},
        materials = ${data.materials && data.materials.length > 0 ? data.materials : null},
        is_active = ${data.isActive !== false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, vendor: result[0] })
  } catch (error) {
    console.error("Error updating vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log("[DELETE vendor] Attempting to delete vendor with ID:", id)

    await sql`
      DELETE FROM vendors
      WHERE id = ${id}
    `

    console.log("[DELETE vendor] Successfully deleted vendor with ID:", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE vendor] Error deleting vendor:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
