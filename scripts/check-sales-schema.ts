import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function checkSchema() {
  try {
    // Check sale_activities table columns
    const activityColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sale_activities' 
      ORDER BY ordinal_position
    `
    console.log("sale_activities table columns:")
    console.table(activityColumns)

    // Check sale_payments table columns
    const paymentColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sale_payments' 
      ORDER BY ordinal_position
    `
    console.log("\nsale_payments table columns:")
    console.table(paymentColumns)

    // Test if generate_sale_no works
    const saleNo = await sql`SELECT generate_sale_no() as sale_no`
    console.log("\nGenerated sale_no:", saleNo[0]?.sale_no)

  } catch (error) {
    console.error("Error:", error)
  }
}

checkSchema()
