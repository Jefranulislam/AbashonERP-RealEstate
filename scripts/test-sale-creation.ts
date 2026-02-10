import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function testSaleCreation() {
  try {
    console.log("Step 1: Generate sale number...")
    const saleNoResult = await sql`SELECT generate_sale_no() as sale_no`
    const saleNo = saleNoResult[0]?.sale_no
    console.log("Generated sale_no:", saleNo)

    console.log("\nStep 2: Test inserting a sale...")
    const result = await sql`
      INSERT INTO sales (
        sale_no, sale_type, sale_status,
        customer_id, seller_id, project_id, product_id,
        sale_date, booking_date,
        base_price, discount_amount, discount_percent, net_price,
        booking_amount, down_payment, total_paid, outstanding_amount,
        payment_plan, installment_count, installment_amount,
        expected_handover_date, agreement_no, notes,
        nominee_name, nominee_phone, nominee_relation, nominee_nid,
        reference_by, commission_amount
      ) VALUES (
        ${saleNo}, 
        'booking', 
        'booked',
        ${null},
        ${null},
        ${null},
        ${null},
        ${new Date().toISOString().split('T')[0]},
        ${new Date().toISOString().split('T')[0]},
        ${100000},
        ${0},
        ${0},
        ${100000},
        ${10000},
        ${0},
        ${10000},
        ${90000},
        'installment',
        ${12},
        ${7500},
        ${null},
        ${null},
        ${'Test sale'},
        ${null},
        ${null},
        ${null},
        ${null},
        ${null},
        ${null}
      )
      RETURNING *
    `
    console.log("Sale created successfully!")
    console.log("Sale ID:", result[0]?.id)

    // Clean up - delete the test sale
    console.log("\nStep 3: Cleaning up test sale...")
    await sql`DELETE FROM sales WHERE id = ${result[0]?.id}`
    console.log("Test sale deleted.")

    console.log("\n✅ All steps completed successfully!")
  } catch (error: any) {
    console.error("\n❌ Error:", error.message)
    console.error("Full error:", error)
  }
}

testSaleCreation()
