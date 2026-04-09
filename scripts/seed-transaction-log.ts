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
  "Decription": string; // Note: Typo in CSV
  "Type": string; // Credit or Debit (REVERSED in CSV - we'll fix it)
  "Qty": string;
  "Rate": string;
  "Amount": string;
  "Inventory": string;
  "Account HEAD ID": string;
  // "Type": string; // Duplicate column - will be ignored
  "Memo / Note/ Comments": string;
  "Vendor Name": string;
  "Paid Amount": string;
  "Payable": string;
  "Receivable": string;
}

// Account Head Mapping based on Type/Category
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
  "": "General Expense" // Default
};

async function seedTransactionLog() {
  console.log("🌱 Starting transaction log seeding...");

  try {
    // 1. Read CSV file
    const csvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Log Activity .csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as TransactionLog[];

    console.log(`📄 Found ${records.length} transactions to process`);

    // 2. Get or create project
    let project = await sql`SELECT id FROM projects WHERE project_name = 'Kuddus Nur Heaven' LIMIT 1`;
    if (project.length === 0) {
      console.log("📝 Creating project: Kuddus Nur's Heaven");
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

    // 4. Get or create account heads
    const accountHeads = await sql`SELECT id, head_name FROM income_expense_heads WHERE is_active = true`;
    const accountHeadMap = new Map(accountHeads.map(h => [h.head_name.toLowerCase().trim(), h.id]));
    console.log(`📋 Found ${accountHeads.length} account heads in database`);

    // Create missing account heads
    for (const [key, headName] of Object.entries(ACCOUNT_HEAD_MAPPING)) {
      const normalizedName = headName.toLowerCase().trim();
      if (!accountHeadMap.has(normalizedName)) {
        console.log(`➕ Creating account head: ${headName}`);
        const newHead = await sql`
          INSERT INTO income_expense_heads (head_name, type, is_active)
          VALUES (${headName}, 'Dr', true)
          RETURNING id, head_name
        `;
        accountHeadMap.set(normalizedName, newHead[0].id);
      }
    }

    // 5. Process transactions
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const record of records) {
      try {
        const date = record["Date(D-M-Y)"];
        const amount = record["Amount"];
        const description = record["Decription"];
        const typeFromCSV = record["Type"];
        const vendorName = record["Vendor Name"];
        const accountHeadType = record["Account HEAD ID"]; // This contains the type like "Rod", "Cement" etc.
        
        // Skip empty records
        if (!date || !amount || amount === "0" || amount.trim() === "") {
          skippedCount++;
          continue;
        }

        // Parse date (DD/MM/YYYY to YYYY-MM-DD)
        const dateParts = date.split("/");
        if (dateParts.length !== 3) {
          console.log(`⚠️ Skipping invalid date format: ${date}`);
          skippedCount++;
          continue;
        }
        const [day, month, year] = dateParts;
        const transactionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Parse amount (remove commas)
        const amountNum = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(amountNum)) {
          console.log(`⚠️ Skipping invalid amount: ${amount}`);
          skippedCount++;
          continue;
        }

        // FIX: REVERSE THE CREDIT/DEBIT from CSV
        // In CSV: Expenses marked as "Debit", Customer payments as "Credit"
        // In Accounting: Expenses should be "Credit", Customer payments should be "Debit"
        let voucherType = typeFromCSV;
        
        // If it's a customer payment (receivable), it should be DEBIT (money IN)
        if (description && (description.includes("Booking") || 
            description.includes("Installment") || 
            description.includes("Rasel") ||
            description.includes("Belal"))) {
          // These are RECEIPTS - should be DEBIT but CSV shows Credit
          voucherType = typeFromCSV === "Credit" ? "Debit" : typeFromCSV;
        } else {
          // These are PAYMENTS/EXPENSES - should be CREDIT but CSV shows Debit
          voucherType = typeFromCSV === "Debit" ? "Credit" : typeFromCSV;
        }

        // Get vendor ID if available
        let vendorId = null;
        if (vendorName && vendorName.trim()) {
          const vendorKey = vendorName.toLowerCase().trim();
          vendorId = vendorMap.get(vendorKey) || null;
          
          if (!vendorId) {
            // console.log(`⚠️ Vendor not found: ${vendorName}`);
          }
        }

        // Get account head ID based on the "Account HEAD ID" column (which has types)
        let accountHeadId = null;
        if (accountHeadType && accountHeadType.trim()) {
          const headName = ACCOUNT_HEAD_MAPPING[accountHeadType] || ACCOUNT_HEAD_MAPPING[""];
          accountHeadId = accountHeadMap.get(headName.toLowerCase().trim()) || null;
        }

        // Log the transaction
        const descShort = description ? description.substring(0, 40) : "No description";
        console.log(`📝 ${transactionDate} | ${voucherType.padEnd(6)} | ₹${amountNum.toLocaleString().padStart(10)} | ${descShort}${vendorName ? ` | ${vendorName}` : ''}`);
        
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing record:`, record.Decription, error);
        errorCount++;
      }
    }

    console.log("\n📊 Seeding Summary:");
    console.log(`   ✅ Successfully processed: ${successCount}`);
    console.log(`   ⚠️ Skipped: ${skippedCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${records.length}`);

    console.log("\n⚠️ IMPORTANT NOTES:");
    console.log("1. All DEBIT/CREDIT entries have been REVERSED from the CSV");
    console.log("2. Customer payments (Booking/Installment) are now DEBIT (money IN)");
    console.log("3. All expenses/payments are now CREDIT (money OUT)");
    console.log("4. Account heads have been created based on transaction types");
    console.log("\n5. To complete the import, you need to:");
    console.log("   - Create proper voucher entries (Debit/Credit Vouchers)");
    console.log("   - Link transactions to bank accounts");
    console.log("   - Add customer records for bookings");

  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    throw error;
  }
}

// Run the seeding function
seedTransactionLog()
  .then(() => {
    console.log("\n✨ Transaction log analysis completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Transaction log analysis failed:", error);
    process.exit(1);
  });
