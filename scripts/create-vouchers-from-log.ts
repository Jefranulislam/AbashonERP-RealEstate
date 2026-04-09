// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

// Now import db after env is loaded
import { sql } from "../lib/db";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

interface TransactionLog {
  "Date(D-M-Y)": string;
  "PROJECT": string;
  "Decription": string;
  "Type": string;
  "Qty": string;
  "Rate": string;
  "Amount": string;
  "Inventory": string;
  "Account HEAD ID": string;
  "Memo / Note/ Comments": string;
  "Vendor Name": string;
}

const ACCOUNT_HEAD_MAPPING: Record<string, string> = {
  "Rod": "Steel/Rod Purchase",
  "Cement": "Cement Purchase",
  "Stone": "Stone Purchase",
  "Sand": "Sand Purchase",
  "Silicon Sand": "Silicon Sand Purchase",
  "Bricks": "Bricks Purchase",
  "Aggregate": "Aggregate Purchase",
  "Carrying": "Transportation/Carrying Cost",
  "Constractoin Cost": "Construction Labor",
  "Constraction": "Construction Labor",
  "": "General Expense"
};

async function createVouchers() {
  console.log("🌱 Starting voucher creation from transaction log...");

  try {
    // 1. Read CSV file
    const csvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Update Log Activity.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as TransactionLog[];

    console.log(`📄 Found ${records.length} transactions to process`);

    // 2. Get project
    let project = await sql`SELECT id FROM projects WHERE project_name ILIKE '%Kuddus%Heaven%' LIMIT 1`;
    if (project.length === 0) {
      console.log("❌ Project not found. Creating project...");
      project = await sql`
        INSERT INTO projects (project_name, is_active)
        VALUES ('Kuddus Nur Heaven', true)
        RETURNING id
      `;
    }
    const projectId = project[0].id;
    console.log(`✅ Project ID: ${projectId}`);

    // 3. Get vendor mappings
    const vendors = await sql`SELECT id, vendor_name FROM vendors WHERE is_active = true`;
    const vendorMap = new Map(vendors.map(v => [v.vendor_name.toLowerCase().trim(), v.id]));
    console.log(`📋 Found ${vendors.length} vendors in database`);

    // 4. Get account heads
    const accountHeads = await sql`SELECT id, head_name FROM income_expense_heads WHERE is_active = true`;
    const accountHeadMap = new Map(accountHeads.map(h => [h.head_name.toLowerCase().trim(), h.id]));
    console.log(`📋 Found ${accountHeads.length} account heads in database`);

    // 5. Get bank/cash accounts
    const bankAccounts = await sql`SELECT id, account_title FROM bank_cash_accounts WHERE is_active = true`;
    console.log(`📋 Found ${bankAccounts.length} bank/cash accounts:`);
    bankAccounts.forEach(acc => console.log(`   - ${acc.account_title} (ID: ${acc.id})`));
    
    if (bankAccounts.length === 0) {
      console.log("❌ No bank/cash accounts found. Please create at least one bank account first.");
      process.exit(1);
    }

    // Use first bank account as default (user mentioned it's mostly bank transfer)
    const defaultBankId = bankAccounts[0].id;
    console.log(`💳 Using default bank account: ${bankAccounts[0].account_title} (ID: ${defaultBankId})`);

    // 6. Get existing voucher counts for numbering
    const creditCount = await sql`SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = 'Credit'`;
    const debitCount = await sql`SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = 'Debit'`;
    let creditCounter = Number(creditCount[0].count) + 1;
    let debitCounter = Number(debitCount[0].count) + 1;

    // 7. Process transactions
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log("\n🔄 Creating vouchers...\n");

    for (const record of records) {
      try {
        const date = record["Date(D-M-Y)"];
        const amount = record["Amount"];
        const description = record["Decription"];
        const typeFromCSV = record["Type"];
        const vendorName = record["Vendor Name"];
        const accountHeadType = record["Account HEAD ID"];
        const qty = record["Qty"];
        const rate = record["Rate"];
        const inventory = record["Inventory"];
        const memo = record["Memo / Note/ Comments"];
        
        // Skip empty records
        if (!date || !amount || amount === "0" || amount.trim() === "") {
          skippedCount++;
          continue;
        }

        // Parse date from D/M/Y to M/D/Y format properly
        const dateParts = date.split("/");
        if (dateParts.length !== 3) {
          console.log(`⚠️ Skipping invalid date format: ${date}`);
          skippedCount++;
          continue;
        }
        const [day, month, year] = dateParts;
        // Convert to M/D/Y format for proper date parsing
        const transactionDate = new Date(`${month}/${day}/${year}`);
        
        // Validate the date
        if (isNaN(transactionDate.getTime())) {
          console.log(`⚠️ Skipping invalid date: ${date}`);
          skippedCount++;
          continue;
        }
        
        // Format as YYYY-MM-DD for database
        const dbDate = transactionDate.toISOString().split('T')[0];

        // Parse amount
        const amountNum = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(amountNum)) {
          console.log(`⚠️ Skipping invalid amount: ${amount}`);
          skippedCount++;
          continue;
        }

        // Determine voucher type (REVERSED from CSV)
        let voucherType = "";
        const isReceipt = description && (
          description.toLowerCase().includes("booking") || 
          description.toLowerCase().includes("installment") ||
          description.toLowerCase().includes("rasel") ||
          description.toLowerCase().includes("belal")
        );

        if (isReceipt) {
          voucherType = "Debit"; // Money IN
        } else {
          voucherType = "Credit"; // Money OUT
        }

        // Get account head ID
        let expenseHeadId = null;
        if (accountHeadType && accountHeadType.trim()) {
          const headName = ACCOUNT_HEAD_MAPPING[accountHeadType] || ACCOUNT_HEAD_MAPPING[""];
          expenseHeadId = accountHeadMap.get(headName.toLowerCase().trim());
        }

        // If still no account head, use General Expense
        if (!expenseHeadId) {
          expenseHeadId = accountHeadMap.get("general expense");
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

        // Create particulars (description with vendor if available)
        let particulars = description || "Transaction";
        if (vendorName && vendorName.trim()) {
          particulars += ` - Vendor: ${vendorName}`;
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
            ${particulars},
            ${qty || null},
            ${rate || null},
            ${inventory || null},
            ${memo || null},
            ${vendorName || null},
            ${accountHeadType || null},
            true
          )
          RETURNING id, voucher_no, voucher_type, amount
        `;

        const descShort = description ? description.substring(0, 35) : "No description";
        console.log(`✅ ${result[0].voucher_no} | ${result[0].voucher_type.padEnd(6)} | ${dbDate} | ₹${amountNum.toLocaleString().padStart(10)} | ${descShort}`);
        
        successCount++;

      } catch (error) {
        const desc = record["Decription"] || "Unknown";
        console.error(`❌ Error processing: ${desc.substring(0, 30)}`, error);
        errorCount++;
      }
    }

    console.log("\n📊 Voucher Creation Summary:");
    console.log(`   ✅ Successfully created: ${successCount} vouchers`);
    console.log(`   ⚠️ Skipped: ${skippedCount} records`);
    console.log(`   ❌ Failed: ${errorCount} records`);
    console.log(`   📝 Total processed: ${records.length}`);

    console.log("\n💡 Next Steps:");
    console.log("   1. Review vouchers in the accounting system");
    console.log("   2. Update vendor information with bank details");
    console.log("   3. Link specific transactions to customers if needed");
    console.log("   4. Verify account head mappings");

  } catch (error) {
    console.error("❌ Fatal error during voucher creation:", error);
    throw error;
  }
}

createVouchers()
  .then(() => {
    console.log("\n✨ Voucher creation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Voucher creation failed:", error);
    process.exit(1);
  });
