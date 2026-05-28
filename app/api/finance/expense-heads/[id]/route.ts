import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = parseInt((await context.params).id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const data = await request.json()
    if (!data || typeof data.headName !== 'string' || data.headName.trim() === '') {
      return NextResponse.json({ error: 'Invalid headName' }, { status: 400 })
    }

    const incExpTypeId = data.incExpTypeId === undefined || data.incExpTypeId === "none" ? null : data.incExpTypeId
    const parentId = data.parentId === undefined || data.parentId === "none" ? null : data.parentId
    const isGroup = data.isGroup === true
    const type = data.type || "Dr"
    const unit = data.unit || null
    const accountCode = data.accountCode && String(data.accountCode).trim() ? String(data.accountCode).trim() : null
    const headType = data.headType || null
    const accountCategory = data.accountCategory === undefined || data.accountCategory === "none" ? null : data.accountCategory
    const isActive = data.isActive === undefined ? true : !!data.isActive

    if (accountCode && !/^[0-9]{4}$/.test(accountCode)) {
      return NextResponse.json({ error: 'accountCode must be a 4-digit string' }, { status: 400 })
    }

    if (accountCode) {
      const existing = await sql`
        SELECT id FROM income_expense_heads
        WHERE account_code = ${accountCode} AND id <> ${id}
        LIMIT 1
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: 'accountCode already in use' }, { status: 400 })
      }
    }
    
    const res = await sql`
      UPDATE income_expense_heads 
      SET head_name = ${data.headName}, 
          inc_exp_type_id = ${incExpTypeId},
          parent_id = ${parentId},
          is_group = ${isGroup},
          type = ${type},
          unit = ${unit},
          account_code = ${accountCode},
          head_type = ${headType},
          account_category = ${accountCategory},
          is_active = ${isActive},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, head_name, inc_exp_type_id, parent_id, is_group, level, full_path, type, unit, is_active, account_code, head_type, account_category, created_at, updated_at
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Expense head not found" }, { status: 404 })
    }
    
    return NextResponse.json({ head: res[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = parseInt((await context.params).id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const res = await sql`
      DELETE FROM income_expense_heads 
      WHERE id = ${id}
      RETURNING id
    `
    
    if (res.length === 0) {
      return NextResponse.json({ error: "Expense head not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Expense head deleted successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
