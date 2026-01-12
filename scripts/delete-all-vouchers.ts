// Load environment variables FIRST
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

import { sql } from "../lib/db";

async function deleteAllVouchers() {
  console.log("🗑️  Deleting ALL vouchers from database...");

  try {
    const result = await sql`DELETE FROM vouchers`;
    console.log(`✅ Deleted ${result.count} voucher records`);
    
    console.log("✨ Database is now clean and ready for fresh data");
  } catch (error) {
    console.error("❌ Error deleting vouchers:", error);
    process.exit(1);
  }
}

deleteAllVouchers();
