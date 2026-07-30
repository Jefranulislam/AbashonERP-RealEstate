import * as dotenv from "dotenv";
import path from "path";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const old = await sql`SELECT id FROM income_expense_heads WHERE account_code BETWEEN '1000' AND '1031'`;
  const ids = old.map((r:any)=>Number(r.id));
  console.log("old head ids:", ids.length, ids.join(","));

  const checks: Array<[string,string]> = [
    ["vouchers","expense_head_id"],
    ["journal_voucher_details","expense_head_id"],
    ["purchase_order_items","expense_head_id"],
    ["purchase_requisition_items","expense_head_id"],
    ["payment_transactions","expense_head_id"],
  ];
  for (const [t,c] of checks) {
    try {
      const r = await sql.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE ${c} = ANY($1)`, [ids]);
      console.log(`${t}.${c}: ${r[0].n} rows reference old heads`);
    } catch(e:any) { console.log(`${t}.${c}: (skip) ${e.message.split("\n")[0]}`); }
  }
}
run().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1)});
