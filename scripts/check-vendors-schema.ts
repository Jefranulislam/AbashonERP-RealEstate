import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

import { sql } from "../lib/db";

async function checkSchema() {
  console.log("=== VOUCHERS TABLE ===");
  let result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'vouchers' 
    ORDER BY ordinal_position
  `;
  console.log(result);
  
  console.log("\n=== BANK/CASH ACCOUNTS TABLE ===");
  result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'bank_cash_accounts' 
    ORDER BY ordinal_position
  `;
  console.log(result);
  
  console.log("\n=== BANK/CASH ACCOUNTS DATA ===");
  result = await sql`SELECT id, account_title FROM bank_cash_accounts ORDER BY id LIMIT 10`;
  console.log(result);
  
  process.exit(0);
}

checkSchema();
