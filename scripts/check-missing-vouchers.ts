import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

interface TransactionLog {
  "Date(D-M-Y)": string;
  "PROJECT": string;
  "Decription": string;
  "Type": string;
  "Amount": string;
}

(async () => {
  const csvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Copy of Log Activity.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as TransactionLog[];

  console.log(`Total records in CSV: ${records.length}`);
  
  // Check which are missing
  let skippedRecords = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const date = record["Date(D-M-Y)"];
    const amount = record["Amount"];
    const description = record["Decription"];
    
    // Check if should be skipped
    if (!date || !amount || amount === "0" || amount.trim() === "") {
      skippedRecords.push({
        index: i + 1,
        date,
        amount,
        description,
        reason: "Empty date or amount"
      });
      continue;
    }
    
    // Check date validity
    const dateParts = date.split("/");
    if (dateParts.length !== 3) {
      skippedRecords.push({
        index: i + 1,
        date,
        amount,
        description,
        reason: "Invalid date format"
      });
      continue;
    }
    
    const [day, month, year] = dateParts;
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      skippedRecords.push({
        index: i + 1,
        date,
        amount,
        description,
        reason: `Invalid month: ${month}`
      });
    }
  }
  
  console.log(`\nSkipped records: ${skippedRecords.length}`);
  console.log("\nDetails:");
  skippedRecords.forEach(r => {
    console.log(`Row ${r.index}: ${r.date} | ${r.amount} | ${r.description} | Reason: ${r.reason}`);
  });
  
  const vouchers = await sql`SELECT COUNT(*) as count FROM vouchers WHERE project_id = 4`;
  console.log(`\nVouchers in database: ${vouchers[0].count}`);
  console.log(`Expected: ${records.length - skippedRecords.length}`);
  console.log(`Difference: ${records.length - skippedRecords.length - parseInt(vouchers[0].count)}`);
  
  process.exit(0);
})();
