import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

(async () => {
  console.log("Adding missing columns to vouchers table...");
  
  try {
    // Add qty column
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS qty VARCHAR(50)`;
    console.log("✅ Added qty column");
    
    // Add rate column
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS rate VARCHAR(50)`;
    console.log("✅ Added rate column");
    
    // Add memo column
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS memo TEXT`;
    console.log("✅ Added memo column");
    
    // Add vendor_name column
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`;
    console.log("✅ Added vendor_name column");
    
    // Add payment_method column
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255)`;
    console.log("✅ Added payment_method column");
    
    console.log("\n✨ All columns added successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
})();
