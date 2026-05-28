// Load environment variables
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

interface CoARecord {
  "Account Code": string;
  "Account Name": string;
  "Account Category": string;
  "Ledger?": string;
  "Normal Balance": string;
  "Expense Type": string;
  "Unit of Measure (UoM)": string;
}

function normalizeString(v?: string) {
  if (!v && v !== "") return null;
  return String(v).trim();
}

async function ensureAccountCodeSchema() {
  await sql`ALTER TABLE income_expense_heads ADD COLUMN IF NOT EXISTS account_code VARCHAR(4)`;
  await sql`ALTER TABLE income_expense_heads ADD COLUMN IF NOT EXISTS head_type VARCHAR(100)`;
  await sql`ALTER TABLE income_expense_heads ADD COLUMN IF NOT EXISTS account_category VARCHAR(100)`;
}

async function seed() {
  console.log("🌱 Starting account heads seeding...");

  const csvPath = path.join(process.cwd(), "The Chart of Accounts Cluster - Sheet1.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  }) as CoARecord[];

  console.log(`📄 Found ${records.length} rows in Chart of Accounts CSV`);

  try {
    await ensureAccountCodeSchema();

    // Prepare income_expense_types cache (maps name -> id)
    const typesRows = await sql`SELECT id, name FROM income_expense_types`;
    const typeMap = new Map<string, number>();
    typesRows.forEach((r: any) => typeMap.set(String(r.name).toLowerCase(), r.id));

    // Helper to get or create type
    async function getTypeId(name?: string) {
      const n = normalizeString(name);
      if (!n) return null;
      const key = n.toLowerCase();
      if (typeMap.has(key)) return typeMap.get(key)!;
      const res = await sql`
        INSERT INTO income_expense_types (name, is_active)
        VALUES (${n}, true)
        RETURNING id
      `;
      if (res.length > 0) {
        typeMap.set(key, res[0].id);
        return res[0].id;
      }
      return null;
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const accountCode = normalizeString(r["Account Code"]);
      const headName = normalizeString(r["Account Name"]);
      const accountCategory = normalizeString(r["Account Category"]);
      const ledger = normalizeString(r["Ledger?"]);
      const normalBalance = normalizeString(r["Normal Balance"]);
      const expenseType = normalizeString(r["Expense Type"]);
      const unit = normalizeString(r["Unit of Measure (UoM)"]);

      if (!headName) {
        skipped++;
        continue;
      }

      // Map Normal Balance to 'Dr'|'Cr'
      let type = "Dr";
      if (normalBalance) {
        const nb = normalBalance.toLowerCase();
        if (nb.includes("credit")) type = "Cr";
        else if (nb.includes("debit")) type = "Dr";
      }

      const isStock = (accountCategory || "").toLowerCase().includes("inventory") || headName.toLowerCase().includes("inventory");
      const headType = ledger && ledger.toLowerCase().startsWith("y") ? "Ledger" : null;

      // Prefer Expense Type for inc_exp_type; fallback to accountCategory
      const incTypeId = await getTypeId(expenseType || accountCategory || undefined);

      // Find existing by account_code (if present and numeric) or exact head_name
      let existing: any[] = [];
      if (accountCode && /^[0-9]+$/.test(accountCode)) {
        existing = await sql`SELECT id FROM income_expense_heads WHERE account_code = ${accountCode} LIMIT 1`;
      }
      if (existing.length === 0) {
        existing = await sql`SELECT id FROM income_expense_heads WHERE LOWER(head_name) = ${headName.toLowerCase()} LIMIT 1`;
      }

      if (existing.length > 0) {
        const id = existing[0].id;
        await sql`
          UPDATE income_expense_heads SET
            inc_exp_type_id = ${incTypeId},
            type = ${type},
            unit = ${unit},
            is_stock = ${isStock},
            is_active = true,
            account_code = ${accountCode},
            head_type = ${headType},
            account_category = ${accountCategory}
          WHERE id = ${id}
        `;
        updated++;
      } else {
        await sql`
          INSERT INTO income_expense_heads (
            head_name,
            inc_exp_type_id,
            type,
            unit,
            is_stock,
            is_active,
            account_code,
            head_type,
            account_category
          ) VALUES (
            ${headName},
            ${incTypeId},
            ${type},
            ${unit},
            ${isStock},
            true,
            ${accountCode},
            ${headType},
            ${accountCategory}
          )
        `;
        inserted++;
      }
    }

    console.log(`\n✅ Seed complete — inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error while seeding account heads:", error);
    process.exit(1);
  }
}

seed()
  .then(() => {
    console.log("✨ Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
