import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function fixFunctions() {
  try {
    console.log("Fixing generate_sale_no function...")
    
    // Drop and recreate the function with proper variable naming
    await sql`
      DROP FUNCTION IF EXISTS generate_sale_no();
    `
    
    await sql`
      CREATE OR REPLACE FUNCTION generate_sale_no()
      RETURNS VARCHAR(50) AS $$
      DECLARE
          next_num INTEGER;
          prefix_val VARCHAR(20);
          result_sale_no VARCHAR(50);
      BEGIN
          -- Get prefix from settings
          SELECT COALESCE(sale_prefix, 'SALE-') INTO prefix_val FROM settings LIMIT 1;
          IF prefix_val IS NULL THEN
              prefix_val := 'SALE-';
          END IF;
          
          -- Get next number
          SELECT COALESCE(MAX(CAST(SUBSTRING(s.sale_no FROM '[0-9]+$') AS INTEGER)), 0) + 1
          INTO next_num
          FROM sales s WHERE s.sale_no IS NOT NULL;
          
          -- Generate the sale number
          result_sale_no := prefix_val || LPAD(next_num::TEXT, 6, '0');
          
          RETURN result_sale_no;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    console.log("Fixing generate_receipt_no function...")
    
    await sql`
      DROP FUNCTION IF EXISTS generate_receipt_no();
    `
    
    await sql`
      CREATE OR REPLACE FUNCTION generate_receipt_no()
      RETURNS VARCHAR(50) AS $$
      DECLARE
          next_num INTEGER;
          prefix_val VARCHAR(20);
          result_receipt_no VARCHAR(50);
      BEGIN
          -- Get prefix from settings
          SELECT COALESCE(receipt_prefix, 'RCP-') INTO prefix_val FROM settings LIMIT 1;
          IF prefix_val IS NULL THEN
              prefix_val := 'RCP-';
          END IF;
          
          -- Get next number
          SELECT COALESCE(MAX(CAST(SUBSTRING(sp.receipt_no FROM '[0-9]+$') AS INTEGER)), 0) + 1
          INTO next_num
          FROM sale_payments sp WHERE sp.receipt_no IS NOT NULL;
          
          -- Generate the receipt number
          result_receipt_no := prefix_val || LPAD(next_num::TEXT, 6, '0');
          
          RETURN result_receipt_no;
      END;
      $$ LANGUAGE plpgsql;
    `

    console.log("Functions fixed successfully!")

    // Test the functions
    const saleNo = await sql`SELECT generate_sale_no() as sale_no`
    console.log("Generated sale_no:", saleNo[0]?.sale_no)

    const receiptNo = await sql`SELECT generate_receipt_no() as receipt_no`
    console.log("Generated receipt_no:", receiptNo[0]?.receipt_no)

  } catch (error) {
    console.error("Error:", error)
  }
}

fixFunctions()
