import * as dotenv from "dotenv";
import path from "path";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const all = await sql`
    SELECT id, head_name, account_code, parent_id, is_group, level, is_active
    FROM income_expense_heads ORDER BY account_code NULLS FIRST, id`;
  console.log("TOTAL:", all.length, "ACTIVE:", all.filter((r:any)=>r.is_active).length);

  // duplicate names
  const dup = await sql`
    SELECT LOWER(TRIM(head_name)) AS name, COUNT(*)::int AS n,
           array_agg(id ORDER BY id) AS ids,
           array_agg(COALESCE(account_code,'-') ORDER BY id) AS codes
    FROM income_expense_heads
    WHERE is_active = true
    GROUP BY LOWER(TRIM(head_name)) HAVING COUNT(*) > 1
    ORDER BY name`;
  console.log("\nDUPLICATE NAMES:", dup.length, "groups");
  console.table(dup.map((d:any)=>({name:d.name,n:d.n,ids:d.ids.join(","),codes:d.codes.join(",")})));

  // old 1000-1031 ledgers
  const old = all.filter((r:any)=> r.account_code && /^10[0-3][0-9]$/.test(r.account_code));
  console.log("\nOLD 1000-1031 style codes:", old.length);
  console.table(old.map((r:any)=>({id:r.id,name:r.head_name,code:r.account_code,active:r.is_active})));

  // full dump
  console.log("\nFULL LIST:");
  console.table(all.map((r:any)=>({id:r.id,code:r.account_code,name:r.head_name,parent:r.parent_id,grp:r.is_group,lvl:r.level,active:r.is_active})));
}
run().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1)});
