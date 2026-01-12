// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Try loading from multiple locations
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.error("   Make sure .env.local or .env file exists with DATABASE_URL");
  process.exit(1);
}

// Import neon directly instead of lib/db to avoid early import issues
import { neon } from "@neondatabase/serverless";
import { parse } from "csv-parse/sync";

const sql = neon(process.env.DATABASE_URL);

interface TransactionLog {
  "Date(D-M-Y)": string;
  "PROJECT": string;
  "Decription": string;
  "Type": string;
  "Qty": string;
  "Rate": string;
  "Amount": string;
  "Inventory": string;
  "ACCOUNT HEAD": string;
  "Memo / Note/ Comments": string;
  "Vendor Name": string;
}

async function seedCSVTransactions() {
  console.log("🌱 Starting CSV transaction seeding...");

  try {
    // 1. DELETE ALL EXISTING VOUCHERS to avoid duplicates
    console.log("\n🗑️ Deleting all existing vouchers...");
    const deleteResult = await sql`DELETE FROM vouchers`;
    console.log(`✅ Deleted all existing vouchers`);

    // 2. Read CSV file
    const csvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Update Log Activity.csv");
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at: ${csvPath}`);
      process.exit(1);
    }
    
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as TransactionLog[];

    console.log(`📄 Found ${records.length} transactions to process`);

    // 3. Get or create project
    let project = await sql`SELECT id FROM projects WHERE project_name ILIKE '%Kuddus%Heaven%' OR project_name ILIKE '%Kuddus%Nur%' LIMIT 1`;
    if (project.length === 0) {
      console.log("📝 Creating project: Kuddus Nur's Heaven");
      project = await sql`
        INSERT INTO projects (project_name, is_active)
        VALUES ('Kuddus Nur''s Heaven', true)
        RETURNING id
      `;
    }
    const projectId = project[0].id;
    console.log(`✅ Project ID: ${projectId}`);

    // 4. Get or create account heads from CSV
    const accountHeads = await sql`SELECT id, head_name FROM income_expense_heads WHERE is_active = true`;
    const accountHeadMap = new Map<string, number>();
    accountHeads.forEach((h: any) => {
      accountHeadMap.set(h.head_name.toLowerCase().trim(), h.id);
    });
    console.log(`📋 Found ${accountHeads.length} existing account heads`);

    // 5. Get bank/cash accounts
    const bankAccounts = await sql`SELECT id, account_title FROM bank_cash_accounts WHERE is_active = true`;
    console.log(`📋 Found ${bankAccounts.length} bank/cash accounts`);
    
    let defaultBankId = null;
    if (bankAccounts.length > 0) {
      defaultBankId = bankAccounts[0].id;
      console.log(`💳 Using default bank account: ${bankAccounts[0].account_title}`);
    }

    // 6. Process transactions
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let creditCounter = 1;
    let debitCounter = 1;

    console.log("\n🔄 Creating vouchers...\n");

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const date = record["Date(D-M-Y)"];
        const amount = record["Amount"];
        const description = record["Decription"];
        const typeFromCSV = record["Type"]?.trim();
        const vendorName = record["Vendor Name"];
        const accountHead = record["ACCOUNT HEAD"];
        const qty = record["Qty"];
        const rate = record["Rate"];
        const inventory = record["Inventory"];
        const memo = record["Memo / Note/ Comments"];
        
        // Skip empty records
        if (!date || !amount || amount === "0" || amount.trim() === "") {
          console.log(`⚠️ Skipping empty record at row ${i + 2}`);
          skippedCount++;
          continue;
        }

        // Parse date from D/M/Y format
        const dateParts = date.split("/");
        if (dateParts.length !== 3) {
          console.log(`⚠️ Skipping invalid date format: ${date}`);
          skippedCount++;
          continue;
        }
        
        let [day, month, year] = dateParts;
        // Handle 2-digit year
        if (year.length === 2) {
          year = "20" + year;
        }
        // Pad day and month
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        const dbDate = `${year}-${month}-${day}`;
        
        // Validate date
        const testDate = new Date(dbDate);
        if (isNaN(testDate.getTime())) {
          console.log(`⚠️ Skipping invalid date: ${date} -> ${dbDate}`);
          skippedCount++;
          continue;
        }

        // Parse amount (remove commas and handle weird formats)
        const cleanAmount = amount.replace(/,/g, "").trim();
        const amountNum = parseFloat(cleanAmount);
        if (isNaN(amountNum) || amountNum === 0) {
          console.log(`⚠️ Skipping invalid/zero amount: ${amount}`);
          skippedCount++;
          continue;
        }

        // Use the type directly from CSV (Credit or Debit)
        let voucherType = "Credit"; // Default
        if (typeFromCSV) {
          if (typeFromCSV.toLowerCase() === "debit") {
            voucherType = "Debit";
          } else if (typeFromCSV.toLowerCase() === "credit") {
            voucherType = "Credit";
          }
        }

        // Get or create account head
        let expenseHeadId = null;
        if (accountHead && accountHead.trim()) {
          const headKey = accountHead.toLowerCase().trim();
          if (accountHeadMap.has(headKey)) {
            expenseHeadId = accountHeadMap.get(headKey);
          } else {
            // Create new account head
            const headType = voucherType === "Debit" ? "Cr" : "Dr";
            const newHead = await sql`
              INSERT INTO income_expense_heads (head_name, type, is_active)
              VALUES (${accountHead.trim()}, ${headType}, true)
              ON CONFLICT DO NOTHING
              RETURNING id
            `;
            if (newHead.length > 0) {
              expenseHeadId = newHead[0].id;
              accountHeadMap.set(headKey, expenseHeadId);
              console.log(`   ➕ Created account head: ${accountHead}`);
            } else {
              // Try to get it again
              const existingHead = await sql`SELECT id FROM income_expense_heads WHERE LOWER(head_name) = ${headKey} LIMIT 1`;
              if (existingHead.length > 0) {
                expenseHeadId = existingHead[0].id;
                accountHeadMap.set(headKey, expenseHeadId);
              }
            }
          }
        }

        // Generate voucher number
        let voucherNo = "";
        if (voucherType === "Credit") {
          voucherNo = `CR${String(creditCounter).padStart(6, "0")}`;
          creditCounter++;
        } else {
          voucherNo = `DR${String(debitCounter).padStart(6, "0")}`;
          debitCounter++;
        }

        // Insert voucher
        const result = await sql`
          INSERT INTO vouchers (
            voucher_no,
            voucher_type,
            project_id,
            expense_head_id,
            bank_cash_id,
            date,
            amount,
            particulars,
            qty,
            rate,
            inventory,
            memo,
            vendor_name,
            account_head_type,
            is_confirmed
          ) VALUES (
            ${voucherNo},
            ${voucherType},
            ${projectId},
            ${expenseHeadId},
            ${defaultBankId},
            ${dbDate},
            ${amountNum},
            ${description || ""},
            ${qty || null},
            ${rate || null},
            ${inventory || null},
            ${memo || null},
            ${vendorName || null},
            ${accountHead || null},
            true
          )
          RETURNING id, voucher_no, voucher_type, amount, date
        `;

        const descShort = description ? description.substring(0, 35).padEnd(35) : "No description".padEnd(35);
        console.log(`✅ ${result[0].voucher_no} | ${result[0].voucher_type.padEnd(6)} | ${dbDate} | ${amountNum.toLocaleString().padStart(12)} | ${descShort}`);
        
        successCount++;

      } catch (error) {
        const desc = record["Decription"] || "Unknown";
        console.error(`❌ Error processing row ${i + 2}: ${desc.substring(0, 30)}`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 SEEDING SUMMARY");
    console.log("=".repeat(80));
    console.log(`   ✅ Successfully created: ${successCount} vouchers`);
    console.log(`   ⚠️ Skipped: ${skippedCount} records`);
    console.log(`   ❌ Failed: ${errorCount} records`);
    console.log(`   📝 Total processed: ${records.length}`);
    console.log("=".repeat(80));

    // Calculate totals
    const totals = await sql`
      SELECT 
        voucher_type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM vouchers
      GROUP BY voucher_type
    `;
    
    console.log("\n📈 TRANSACTION SUMMARY:");
    totals.forEach((t: any) => {
      console.log(`   ${t.voucher_type}: ${t.count} transactions, Total: ৳${Number(t.total).toLocaleString()}`);
    });

  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    throw error;
  }
}

seedCSVTransactions()
  .then(() => {
    console.log("\n✨ CSV transaction seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
