// Load environment variables FIRST
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

import { sql } from "../lib/db";
import fs from "fs";
import path from "path";

async function runMigration() {
  console.log("🔧 Running voucher details migration...");

  try {
    const migrationPath = path.join(process.cwd(), "scripts", "012_add_voucher_details.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    await sql.unsafe(migrationSQL);
    
    console.log("✅ Migration completed successfully!");
    console.log("   Added columns: qty, rate, inventory, memo, vendor_name, account_head_type");
  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  }
}

runMigration();
