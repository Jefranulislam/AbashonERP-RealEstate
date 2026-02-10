import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Fetch all sales with full details
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customerId")
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let sales = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.mailing_address as customer_address,
        e.name as seller_name,
        p.project_name,
        pr.product_name,
        pr.unit_no,
        pr.floor_no,
        pr.size_sqft,
        pr.unit_type,
        (SELECT COUNT(*) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.is_active = true) as payment_count,
        (SELECT COALESCE(SUM(amount), 0) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.is_active = true AND sp.status NOT IN ('bounced', 'cancelled')) as total_received,
        (SELECT COUNT(*) FROM sale_payment_schedules sps WHERE sps.sale_id = s.id AND sps.status = 'overdue') as overdue_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN employees e ON s.seller_id = e.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.is_active = true
      ${customerId ? sql`AND s.customer_id = ${customerId}` : sql``}
      ${projectId ? sql`AND s.project_id = ${projectId}` : sql``}
      ${status ? sql`AND s.sale_status = ${status}` : sql``}
      ${search ? sql`AND (
        c.customer_name ILIKE ${'%' + search + '%'} 
        OR p.project_name ILIKE ${'%' + search + '%'}
        OR pr.product_name ILIKE ${'%' + search + '%'}
        OR s.sale_no ILIKE ${'%' + search + '%'}
      )` : sql``}
      ORDER BY s.created_at DESC
    `

    return NextResponse.json({ sales })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new sale with full details
export async function POST(request: NextRequest) {
  let step = 'init'
  try {
    step = 'auth'
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    step = 'parse-body'
    const data = await request.json()
    console.log('[sales-v2] Creating sale with data:', JSON.stringify(data, null, 2))
    
    step = 'generate-sale-no'
    // Generate sale number
    let saleNo: string
    try {
      const saleNoResult = await sql`SELECT generate_sale_no() as sale_no`
      saleNo = saleNoResult[0]?.sale_no || `SALE-${Date.now()}`
    } catch (e) {
      console.error('[sales-v2] Error generating sale number:', e)
      saleNo = `SALE-${Date.now()}`
    }
    console.log('[sales-v2] Generated sale_no:', saleNo)

    // Calculate amounts
    step = 'calculate-amounts'
    const basePrice = parseFloat(data.basePrice) || 0
    const utilityCharge = parseFloat(data.utilityCharge) || 0
    const discountPercent = parseFloat(data.discountPercent) || 0
    const discountAmount = parseFloat(data.discountAmount) || ((basePrice + utilityCharge) * discountPercent / 100)
    
    // Calculate additional items total
    const additionalItemsTotal = parseFloat(data.additionalItemsTotal) || 0
    
    // Total gross = base + utility + additional items
    const totalGross = basePrice + utilityCharge + additionalItemsTotal
    // Net price = gross - discount
    const netPrice = totalGross - discountAmount
    
    const bookingAmount = parseFloat(data.bookingAmount) || 0
    const downPayment = parseFloat(data.downPayment) || 0
    const outstandingAmount = netPrice - bookingAmount
    console.log('[sales-v2] Amounts:', { basePrice, utilityCharge, additionalItemsTotal, totalGross, discountPercent, discountAmount, netPrice, bookingAmount, downPayment, outstandingAmount })

    step = 'insert-sale'
    // Create the sale
    const result = await sql`
      INSERT INTO sales (
        sale_no, sale_type, sale_status,
        customer_id, seller_id, project_id, product_id,
        sale_date, booking_date,
        base_price, utility_charge, total_gross_price,
        discount_amount, discount_percent, net_price,
        booking_amount, down_payment, total_paid, outstanding_amount,
        payment_plan, installment_count, installment_amount,
        expected_handover_date, agreement_no, notes,
        nominee_name, nominee_phone, nominee_relation, nominee_nid,
        reference_by, commission_amount
      ) VALUES (
        ${saleNo}, 
        ${data.saleType || 'booking'}, 
        ${data.saleStatus || 'booked'},
        ${data.customerId ? parseInt(data.customerId) : null},
        ${data.sellerId ? parseInt(data.sellerId) : null},
        ${data.projectId ? parseInt(data.projectId) : null},
        ${data.productId ? parseInt(data.productId) : null},
        ${data.saleDate || new Date().toISOString().split('T')[0]},
        ${data.bookingDate || data.saleDate || new Date().toISOString().split('T')[0]},
        ${basePrice},
        ${utilityCharge},
        ${totalGross},
        ${discountAmount},
        ${discountPercent},
        ${netPrice},
        ${bookingAmount},
        ${downPayment},
        ${bookingAmount},
        ${outstandingAmount},
        ${data.paymentPlan || 'custom'},
        ${data.installmentCount ? parseInt(data.installmentCount) : null},
        ${data.installmentAmount ? parseFloat(data.installmentAmount) : null},
        ${data.expectedHandoverDate || null},
        ${data.agreementNo || null},
        ${data.notes || null},
        ${data.nomineeName || null},
        ${data.nomineePhone || null},
        ${data.nomineeRelation || null},
        ${data.nomineeNid || null},
        ${data.referenceBy || null},
        ${data.commissionAmount ? parseFloat(data.commissionAmount) : null}
      )
      RETURNING *
    `

    const sale = result[0]
    console.log('[sales-v2] Sale created:', sale?.id)

    // Insert additional items if any
    step = 'insert-additional-items'
    if (data.additionalItems && data.additionalItems.length > 0) {
      for (const item of data.additionalItems) {
        await sql`
          INSERT INTO sale_additional_items (
            sale_id, product_id, item_type, item_name,
            base_price, discount_amount, net_price
          ) VALUES (
            ${sale.id},
            ${item.productId ? parseInt(item.productId) : null},
            ${item.itemType},
            ${item.itemName},
            ${parseFloat(item.basePrice) || 0},
            ${parseFloat(item.discountAmount) || 0},
            ${parseFloat(item.netPrice) || 0}
          )
        `
      }
      console.log('[sales-v2] Additional items inserted:', data.additionalItems.length)
    }

    step = 'update-product'
    // Update product status to 'booked'
    if (data.productId) {
      await sql`
        UPDATE products 
        SET status = 'booked', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${data.productId}
      `
    }

    step = 'create-schedules'
    // Create payment schedule
    const schedules = []
    
    // Booking amount schedule (already paid)
    if (bookingAmount > 0) {
      schedules.push({
        type: 'booking',
        no: 0,
        label: 'Booking Amount',
        date: data.bookingDate || data.saleDate,
        amount: bookingAmount,
        percentage: (bookingAmount / netPrice * 100).toFixed(2),
        status: 'paid',
        isCustom: false
      })
    }

    // Down payment schedule
    if (downPayment > 0) {
      const downPaymentDate = new Date(data.bookingDate || data.saleDate)
      downPaymentDate.setDate(downPaymentDate.getDate() + 30)
      schedules.push({
        type: 'down_payment',
        no: 0,
        label: 'Down Payment',
        date: downPaymentDate.toISOString().split('T')[0],
        amount: downPayment,
        percentage: (downPayment / netPrice * 100).toFixed(2),
        status: 'pending',
        isCustom: false
      })
    }

    // Handle custom payment schedules
    if (data.paymentPlan === 'custom' && data.paymentSchedules && data.paymentSchedules.length > 0) {
      // Use custom schedules from the dynamic payment plan
      let sortOrder = schedules.length
      for (const customSchedule of data.paymentSchedules) {
        const dueDate = new Date(
          parseInt(customSchedule.year),
          parseInt(customSchedule.month) - 1,
          15 // Middle of the month
        )
        schedules.push({
          type: 'installment',
          no: sortOrder + 1,
          label: customSchedule.label,
          date: dueDate.toISOString().split('T')[0],
          month: parseInt(customSchedule.month),
          year: parseInt(customSchedule.year),
          amount: parseFloat(customSchedule.amount) || 0,
          percentage: parseFloat(customSchedule.percentage) || 0,
          status: 'pending',
          isCustom: true,
          sortOrder: sortOrder
        })
        sortOrder++
      }
    } else if (data.paymentPlan === 'installment' && data.installmentCount > 0) {
      // Auto-generate installment schedules
      const installmentTotal = netPrice - bookingAmount - downPayment
      const installmentAmount = installmentTotal / data.installmentCount
      const startDate = new Date(data.bookingDate || data.saleDate)
      startDate.setMonth(startDate.getMonth() + 2) // Start installments 2 months after booking

      for (let i = 1; i <= data.installmentCount; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))
        schedules.push({
          type: 'installment',
          no: i,
          label: `Installment ${i}`,
          date: dueDate.toISOString().split('T')[0],
          month: dueDate.getMonth() + 1,
          year: dueDate.getFullYear(),
          amount: installmentAmount,
          percentage: (installmentAmount / netPrice * 100).toFixed(2),
          status: 'pending',
          isCustom: false,
          sortOrder: schedules.length + i - 1
        })
      }
    }

    // Insert all schedules
    for (const schedule of schedules) {
      await sql`
        INSERT INTO sale_payment_schedules (
          sale_id, schedule_type, installment_no, payment_label,
          due_date, due_month, due_year, 
          amount, percentage, paid_amount, status, is_custom, sort_order
        ) VALUES (
          ${sale.id}, ${schedule.type}, ${schedule.no}, ${schedule.label},
          ${schedule.date}, ${schedule.month || null}, ${schedule.year || null},
          ${schedule.amount}, ${schedule.percentage || null},
          ${schedule.status === 'paid' ? schedule.amount : 0}, 
          ${schedule.status}, ${schedule.isCustom || false}, ${schedule.sortOrder || 0}
        )
      `
    }
    console.log('[sales-v2] Payment schedules created:', schedules.length)

    // Record initial payment if booking amount received
    if (bookingAmount > 0 && data.createInitialPayment !== false) {
      step = 'create-initial-payment'
      const receiptNoResult = await sql`SELECT generate_receipt_no() as receipt_no`
      const receiptNo = receiptNoResult[0]?.receipt_no || `RCP-${Date.now()}`

      // Get the booking schedule
      const bookingSchedule = await sql`
        SELECT id FROM sale_payment_schedules 
        WHERE sale_id = ${sale.id} AND schedule_type = 'booking'
        LIMIT 1
      `

      await sql`
        INSERT INTO sale_payments (
          receipt_no, sale_id, customer_id, schedule_id,
          payment_date, amount, payment_method, status, remarks
        ) VALUES (
          ${receiptNo}, ${sale.id}, ${data.customerId ? parseInt(data.customerId) : null},
          ${bookingSchedule[0]?.id || null},
          ${data.bookingDate || data.saleDate || new Date().toISOString().split('T')[0]},
          ${bookingAmount},
          ${data.paymentMethod || 'cash'},
          'received',
          'Booking payment'
        )
      `
    }

    step = 'log-activity'
    // Log activity - skip performed_by since user.id is UUID and column expects integer
    await sql`
      INSERT INTO sale_activities (
        sale_id, activity_type, description
      ) VALUES (
        ${sale.id}, 'created', 
        ${'Sale created with booking amount ' + bookingAmount}
      )
    `

    step = 'fetch-complete-sale'
    // Fetch complete sale data
    const completeSale = await sql`
      SELECT 
        s.*,
        c.customer_name,
        c.phone as customer_phone,
        p.project_name,
        pr.product_name,
        pr.unit_no
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN products pr ON s.product_id = pr.id
      WHERE s.id = ${sale.id}
    `

    return NextResponse.json({ 
      success: true, 
      sale: completeSale[0],
      saleNo: saleNo,
      message: "Sale created successfully"
    })
  } catch (error: any) {
    console.error(`[sales-v2] Error at step '${step}':`, error)
    return NextResponse.json({ 
      error: "Internal server error", 
      step,
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
