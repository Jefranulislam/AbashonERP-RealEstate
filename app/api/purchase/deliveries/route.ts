import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'edge'

// GET: List all deliveries
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const poId = searchParams.get("poId")
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    let query = sql`
      SELECT 
        md.*,
        po.po_number,
        v.vendor_name,
        p.project_name,
        e1.name as received_by_name,
        e2.name as quality_checked_by_name
      FROM material_deliveries md
      LEFT JOIN purchase_orders po ON md.po_id = po.id
      LEFT JOIN vendors v ON md.vendor_id = v.id
      LEFT JOIN projects p ON md.project_id = p.id
      LEFT JOIN employees e1 ON md.received_by = e1.id
      LEFT JOIN employees e2 ON md.quality_checked_by = e2.id
      WHERE md.is_active = true
    `

    if (poId) query = sql`${query} AND md.po_id = ${poId}`
    if (projectId && projectId !== 'all') query = sql`${query} AND md.project_id = ${projectId}`
    if (status && status !== 'all') query = sql`${query} AND md.delivery_status = ${status}`

    query = sql`${query} ORDER BY md.delivery_date DESC, md.created_at DESC`

    const deliveries = await query

    return NextResponse.json({ deliveries })
  } catch (error) {
    console.error("[v0] Error fetching deliveries:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Record new delivery
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Generate delivery number
    const lastDelivery = await sql`
      SELECT delivery_number FROM material_deliveries 
      WHERE delivery_number LIKE ${'DEL-' + new Date().getFullYear() + '-%'}
      ORDER BY created_at DESC LIMIT 1
    `
    
    const year = new Date().getFullYear()
    const lastNum = lastDelivery.length > 0 ? parseInt(lastDelivery[0].delivery_number.split('-')[2]) : 0
    const deliveryNumber = `DEL-${year}-${String(lastNum + 1).padStart(4, '0')}`

    const delivery = await sql`
      INSERT INTO material_deliveries (
        delivery_number,
        po_id,
        po_item_id,
        vendor_id,
        project_id,
        delivery_date,
        delivery_time,
        delivery_slip_number,
        vehicle_number,
        driver_name,
        driver_phone,
        received_by,
        received_date,
        received_time,
        material_type,
        material_specification,
        ordered_qty,
        delivered_qty,
        accepted_qty,
        rejected_qty,
        shortage_qty,
        excess_qty,
        unit_of_measurement,
        quality_status,
        quality_checked_by,
        quality_check_date,
        quality_remarks,
        quality_photos,
        storage_location,
        warehouse_section,
        delivery_status,
        remarks
      ) VALUES (
        ${deliveryNumber},
        ${data.poId},
        ${data.poItemId},
        ${data.vendorId},
        ${data.projectId || null},
        ${data.deliveryDate},
        ${data.deliveryTime || null},
        ${data.deliverySlipNumber || null},
        ${data.vehicleNumber || null},
        ${data.driverName || null},
        ${data.driverPhone || null},
        ${data.receivedBy || user.id},
        ${data.receivedDate || data.deliveryDate},
        ${data.receivedTime || null},
        ${data.materialType || null},
        ${data.materialSpecification || null},
        ${data.orderedQty},
        ${data.deliveredQty},
        ${data.acceptedQty},
        ${data.rejectedQty || 0},
        ${data.shortageQty || 0},
        ${data.excessQty || 0},
        ${data.unitOfMeasurement || null},
        ${data.qualityStatus || 'Pending'},
        ${data.qualityCheckedBy || null},
        ${data.qualityCheckDate || null},
        ${data.qualityRemarks || null},
        ${data.qualityPhotos || null},
        ${data.storageLocation || null},
        ${data.warehouseSection || null},
        ${data.deliveryStatus || 'Received'},
        ${data.remarks || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, delivery: delivery[0] })
  } catch (error) {
    console.error("[v0] Error recording delivery:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
