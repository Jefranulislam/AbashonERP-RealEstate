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
  "Qty": string;
  "Rate": string;
  "Amount": string;
  "Inventory": string;
  "Account HEAD ID": string;
  "Memo / Note/ Comments": string;
  "Vendor Name": string;
  "Payment Method ": string;
  "Customer ID": string;
  "Receivable": string;
}

async function createVouchersFromUpdatedCSV() {
  console.log("🌱 Starting voucher creation from UPDATED transaction log...");

  try {
    // 1. Read UPDATED CSV file
    const csvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Copy of Log Activity.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    // Parse without column headers first to handle duplicate "Type" columns
    const recordsRaw = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      from_line: 2, // Skip header
    });
    
    // Manual column mapping (0-indexed)
    // Columns: Date(D-M-Y), PROJECT, Decription, Type[0], Qty, Rate, Amount, Inventory, Account HEAD ID, Type[1], Memo, Vendor Name, Payment Method, Customer ID, Receivable
    const records = recordsRaw.map((row: any[]) => ({
      date: row[0],
      project: row[1],
      description: row[2],
      voucherType: row[3], // First "Type" column - Debit/Credit
      qty: row[4],
      rate: row[5],
      amount: row[6],
      inventory: row[7],
      accountHeadId: row[8],
      accountType: row[9], // Second "Type" column - Rod/Cement/etc
      memo: row[10],
      vendorName: row[11],
      paymentMethod: row[12],
      customerId: row[13],
      receivable: row[14]
    }));

    console.log(`📄 Found ${records.length} transactions to process`);

    // 2. Get project
    const projects = await sql`SELECT id, project_name FROM projects WHERE project_name ILIKE '%Heaven%'`;
    if (projects.length === 0) {
      console.log("❌ Project not found.");
      process.exit(1);
    }
    const projectId = projects[0].id;
    console.log(`✅ Project: ${projects[0].project_name} (ID: ${projectId})`);

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
    if (bankAccounts.length === 0) {
      console.log("❌ No bank/cash accounts found.");
      process.exit(1);
    }
    const defaultBankId = bankAccounts[0].id;
    console.log(`💳 Using bank account: ${bankAccounts[0].account_title} (ID: ${defaultBankId})`);

    // 6. Get existing voucher counts
    const creditCount = await sql`SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = 'Credit'`;
    const debitCount = await sql`SELECT COUNT(*) as count FROM vouchers WHERE voucher_type = 'Debit'`;
    let creditCounter = Number(creditCount[0].count) + 1;
    let debitCounter = Number(debitCount[0].count) + 1;

    // 7. Create missing account heads from CSV
    const missingHeads = new Set<string>();
    for (const record of records) {
      const accountHeadName = record.accountHeadId;
      if (accountHeadName && accountHeadName.trim()) {
        const normalized = accountHeadName.toLowerCase().trim();
        if (!accountHeadMap.has(normalized)) {
          missingHeads.add(accountHeadName.trim());
        }
      }
    }

    if (missingHeads.size > 0) {
      console.log(`\n➕ Creating ${missingHeads.size} missing account heads:`);
      for (const headName of missingHeads) {
        const newHead = await sql`
          INSERT INTO income_expense_heads (head_name, type, is_active)
          VALUES (${headName}, 'Dr', true)
          RETURNING id, head_name
        `;
        accountHeadMap.set(headName.toLowerCase().trim(), newHead[0].id);
        console.log(`   ✅ ${headName} (ID: ${newHead[0].id})`);
      }
    }

    // 8. Process transactions
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log("\n🔄 Creating vouchers...\n");

    for (const record of records) {
      try {
        const date = record.date;
        const amount = record.amount;
        const description = record.description;
        const typeFromCSV = record.voucherType; // First "Type" column
        const vendorName = record.vendorName;
        const accountHeadName = record.accountHeadId;
        
        // Skip empty records
        if (!date || !amount || amount === "0" || amount.trim() === "") {
          skippedCount++;
          continue;
        }

        // Parse date - D/M/Y format!
        const dateParts = date.split("/");
        if (dateParts.length !== 3) {
          console.log(`⚠️ Skipping invalid date: ${date}`);
          skippedCount++;
          continue;
        }
        const [day, month, year] = dateParts; // D-M-Y format!
        
        // Validate month
        const monthNum = parseInt(month);
        if (monthNum < 1 || monthNum > 12) {
          console.log(`⚠️ Skipping invalid month: ${date}`);
          skippedCount++;
          continue;
        }
        
        // Validate day
        const dayNum = parseInt(day);
        if (dayNum < 1 || dayNum > 31) {
          console.log(`⚠️ Skipping invalid day: ${date}`);
          skippedCount++;
          continue;
        }
        
        const transactionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Parse amount
        const amountNum = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(amountNum)) {
          console.log(`⚠️ Skipping invalid amount: ${amount}`);
          skippedCount++;
          continue;
        }

        // Use the voucher type DIRECTLY from CSV (column 3)
        const voucherType = typeFromCSV && typeFromCSV.trim().toLowerCase() === "debit" ? "Debit" : "Credit";

        // Get account head ID using EXACT name from CSV
        let expenseHeadId = null;
        if (accountHeadName && accountHeadName.trim()) {
          const normalized = accountHeadName.toLowerCase().trim();
          expenseHeadId = accountHeadMap.get(normalized);
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

        // Create particulars
        let particulars = description || "Transaction";
        if (vendorName && vendorName.trim()) {
          particulars += ` - Vendor: ${vendorName}`;
        }
        
        // Get other fields
        const qty = record.qty;
        const rate = record.rate;
        const memo = record.memo;
        const paymentMethod = record.paymentMethod;

        // Insert voucher with ALL fields
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
            memo,
            vendor_name,
            payment_method,
            is_confirmed
          ) VALUES (
            ${voucherNo},
            ${voucherType},
            ${projectId},
            ${expenseHeadId},
            ${defaultBankId},
            ${transactionDate},
            ${amountNum},
            ${particulars},
            ${qty || null},
            ${rate || null},
            ${memo || null},
            ${vendorName || null},
            ${paymentMethod || null},
            true
          )
          RETURNING id, voucher_no, voucher_type, amount
        `;

        const descShort = description ? description.substring(0, 30) : "No description";
        const headShort = accountHeadName ? accountHeadName.substring(0, 25) : "General";
        console.log(`✅ ${result[0].voucher_no} | ${result[0].voucher_type.padEnd(6)} | ${transactionDate} | ৳${amountNum.toLocaleString().padStart(10)} | ${headShort.padEnd(25)} | ${descShort}`);
        
        successCount++;

      } catch (error: any) {
        const desc = record.description || "Unknown";
        console.error(`❌ ${desc.substring(0, 30)}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Voucher Creation Summary:");
    console.log(`   ✅ Successfully created: ${successCount} vouchers`);
    console.log(`   ⚠️ Skipped: ${skippedCount} records`);
    console.log(`   ❌ Failed: ${errorCount} records`);
    console.log(`   📝 Total processed: ${records.length}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  }
}

createVouchersFromUpdatedCSV()
  .then(() => {
    console.log("\n✨ Voucher creation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Voucher creation failed:", error);
    process.exit(1);
  });
