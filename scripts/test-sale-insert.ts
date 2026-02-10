// Test sales-v2 API directly
import postgres from "postgres"

const sql = postgres("postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function testInsert() {
  try {
    // Test if generate_sale_no function exists
    console.log("Testing generate_sale_no function...")
    try {
      const saleNoResult = await sql`SELECT generate_sale_no() as sale_no`
      console.log("  ✓ generate_sale_no:", saleNoResult[0]?.sale_no)
    } catch (e: any) {
      console.log("  ✗ generate_sale_no FAILED:", e.message)
    }

    // Test if generate_receipt_no function exists
    console.log("\nTesting generate_receipt_no function...")
    try {
      const receiptNoResult = await sql`SELECT generate_receipt_no() as receipt_no`
      console.log("  ✓ generate_receipt_no:", receiptNoResult[0]?.receipt_no)
    } catch (e: any) {
      console.log("  ✗ generate_receipt_no FAILED:", e.message)
    }

    // Test inserting into sales table (minimal data)
    console.log("\nTesting INSERT into sales...")
    try {
      const insertResult = await sql`
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
          ${'TEST-' + Date.now()}, 
          'booking', 
          'booked',
          null, null, null, null,
          ${new Date().toISOString().split('T')[0]},
          ${new Date().toISOString().split('T')[0]},
          ${10000},
          ${500},
          ${10500},
          ${0},
          ${0},
          ${10500},
          ${1000},
          ${0},
          ${1000},
          ${9500},
          'custom',
          null, null,
          null, null, null,
          null, null, null, null,
          null, null
        )
        RETURNING id
      `
      console.log("  ✓ INSERT succeeded, sale id:", insertResult[0]?.id)
      
      // Delete the test sale
      await sql`DELETE FROM sales WHERE id = ${insertResult[0].id}`
      console.log("  ✓ Test sale deleted")
    } catch (e: any) {
      console.log("  ✗ INSERT FAILED:", e.message)
      console.log("    Full error:", e)
    }

  } catch (error) {
    console.error('General Error:', error)
  } finally {
    await sql.end()
  }
}

testInsert()
