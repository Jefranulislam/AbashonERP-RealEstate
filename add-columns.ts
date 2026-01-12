import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "./lib/db";

async function addColumns() {
  try {
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS qty VARCHAR(50)`;
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS rate VARCHAR(50)`;
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS inventory VARCHAR(50)`;
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS memo TEXT`;
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`;
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS account_head_type VARCHAR(255)`;
    console.log("✅ All columns added successfully!");
  } catch (e) {
    console.error(e);
  }
}

addColumns();
