import * as dotenv from "dotenv";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { ensureAccountCodeSchema } from "../lib/account-code";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await ensureAccountCodeSchema();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM income_expense_heads`;
  console.log("count:", rows[0].count);
  const sample = await sql`SELECT id, head_name, account_code, is_group, level, is_active FROM income_expense_heads ORDER BY id LIMIT 10`;
  console.table(sample);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
