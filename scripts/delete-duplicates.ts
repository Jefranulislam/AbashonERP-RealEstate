import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

(async () => {
  await sql`DELETE FROM vouchers WHERE project_id = 5`;
  console.log('Deleted vouchers from project 5');
  
  await sql`DELETE FROM vouchers WHERE voucher_no IN ('DR000002', 'CR000001')`;
  console.log('Deleted duplicates');
  
  process.exit(0);
})();
