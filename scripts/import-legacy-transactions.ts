import "dotenv/config"
import { sql } from "../lib/db"
import { getNextVendorCode } from "../lib/vendor-code"
import * as fs from "fs"
import * as path from "path"
import * as csv from "csv-parse/sync"

interface VendorRow {
  "Vendor Name": string
  "Person Name - NICK NAME": string
  "Account Number": string
  "Account Name": string
  "Phone Number": string
  "Address": string
  "Bank Name": string
}

interface TransactionRow {
  "Date(D-M-Y)": string
  "PROJECT": string
  "Decription": string
  "Type": string
  "Qty": string
  "Rate": string
  "Amount": string
  "Inventory": string
  "ACCOUNT HEAD": string
  "Memo / Note/ Comments": string
  "Vendor Name": string
}

async function importLegacyTransactions() {
  try {
    console.log("🔄 Starting legacy transaction import...")

    // Read CSV files
    const vendorsCsvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - VENDORS.csv")
    const transactionsCsvPath = path.join(process.cwd(), "Constraction Cost Of Kuddus Nur's Heaven - Update Log Activity.csv")

    if (!fs.existsSync(vendorsCsvPath) || !fs.existsSync(transactionsCsvPath)) {
      throw new Error("CSV files not found. Please ensure both vendor and transaction CSV files exist.")
    }

    const vendorsCsv = fs.readFileSync(vendorsCsvPath, "utf-8")
    const transactionsCsv = fs.readFileSync(transactionsCsvPath, "utf-8")

    const vendors: VendorRow[] = csv.parse(vendorsCsv, { columns: true })
    const transactions: TransactionRow[] = csv.parse(transactionsCsv, { columns: true })

    console.log(`✅ Loaded ${vendors.length} vendors`)
    console.log(`✅ Loaded ${transactions.length} transactions`)

    // Get or create project
    const projectName = "Kuddus Nur's Heaven"
    const projects = await sql`SELECT id FROM projects WHERE project_name ILIKE ${projectName} LIMIT 1`
    const projectId = projects.length > 0 ? projects[0].id : 1

    // Get or create account heads by category (simplified)
    const accountHeads = new Map<string, number>()
    
          SELECT id, vendor_code FROM vendors WHERE vendor_name = ${vendorName} LIMIT 1
    const expenseType = await sql`SELECT id FROM income_expense_types WHERE name = 'Miscellaneous' LIMIT 1`
    let typeId = expenseType.length > 0 ? expenseType[0].id : 1
    
    // Create expense types if needed
    if (expenseType.length === 0) {
      const created = await sql`
          const vendorCode = await getNextVendorCode()
        INSERT INTO income_expense_types (name, is_active)
        VALUES ('Miscellaneous', true)
              vendor_code,
        RETURNING id
      `
      typeId = created[0].id
    }

    const categories = new Set(transactions.map((t) => t["ACCOUNT HEAD"]).filter(Boolean))
    console.log(`\n📊 Account categories found: ${Array.from(categories).join(", ")}`)

    for (const category of categories) {
              ${vendorCode},
      const existing = await sql`
        SELECT id FROM income_expense_heads 
        WHERE head_name = ${category} 
        LIMIT 1
      `
      if (existing.length > 0) {
        accountHeads.set(category, existing[0].id)
      } else {
        try {
          const created = await sql`
            INSERT INTO income_expense_heads (head_name, inc_exp_type_id, type, is_active)
            VALUES (${category}, ${typeId}, 'Dr', true)
          console.log(`✅ Created vendor: ${vendorName} (${created[0].vendor_code})`)
          `
          accountHeads.set(category, created[0].id)
          console.log(`✅ Created account head: ${category}`)
        } catch (err) {
          // If creation fails, use a default ID
          console.log(`⚠️  Could not create account head for ${category}`)
          accountHeads.set(category, 1)
        }
      }
    }

    // Insert or update vendors
    const vendorMap = new Map<string, number>()

    for (const vendor of vendors) {
      const vendorName = vendor["Vendor Name"]?.trim()
      if (!vendorName) continue

      const existing = await sql`
        SELECT id FROM vendors WHERE vendor_name = ${vendorName} LIMIT 1
      `

      let vendorId: number
      if (existing.length > 0) {
        vendorId = existing[0].id
      } else {
        const created = await sql`
          INSERT INTO vendors (
            vendor_name,
            mailing_address,
            phone,
            email,
            bank_name,
            bank_account_number,
            description,
            is_active
          ) VALUES (
            ${vendorName},
            ${vendor["Address"] || null},
            ${vendor["Phone Number"] || null},
            ${null},
            ${vendor["Bank Name"] || null},
            ${vendor["Account Number"] || null},
            ${`Contact: ${vendor["Person Name - NICK NAME"] || ""}` || "Legacy Import"},
            true
          )
          RETURNING id
        `
        vendorId = created[0].id
        console.log(`✅ Created vendor: ${vendorName}`)
      }
      vendorMap.set(vendorName, vendorId)
    }

    // Parse and insert transactions as legacy payment records WITH VOUCHERS
    let transactionCount = 0
    let voucherCount = 0
    let totalDebit = 0
    let totalCredit = 0
    const errors: string[] = []

    // Get next voucher number sequence
    const year = new Date().getFullYear()
    const existingVouchers = await sql`
      SELECT voucher_no FROM vouchers 
      WHERE voucher_no LIKE ${'DV-' + year + '-%'}
      ORDER BY created_at DESC LIMIT 1
    `
    let voucherSequence = existingVouchers.length > 0 ? parseInt(existingVouchers[0].voucher_no.split('-')[2]) : 0

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i]
      const dateStr = txn["Date(D-M-Y)"]?.trim()
      const vendorName = txn["Vendor Name"]?.trim()
      const amount = parseFloat(txn["Amount"] || "0")
      const type = txn["Type"]?.trim()
      const accountHead = txn["ACCOUNT HEAD"]?.trim()
      const description = txn["Decription"]?.trim()

      try {
        if (!dateStr || isNaN(amount) || amount === 0) continue

        const [day, month, year] = dateStr.split("/").map(Number)
        if (!day || !month || !year) {
          errors.push(`Row ${i + 2}: Invalid date format "${dateStr}"`)
          continue
        }
        const transactionDate = new Date(year, month - 1, day).toISOString().split("T")[0]

        const accountHeadId = accountHead ? accountHeads.get(accountHead) : null
        const vendorId = vendorName ? vendorMap.get(vendorName) : null

        // Generate unique payment number for legacy import
        const paymentNumber = `LEGACY-${new Date().getTime()}-${i}`

        // Create voucher for this transaction
        voucherSequence++
        const voucherNo = `DV-${year}-${String(voucherSequence).padStart(4, '0')}`
        const voucherType = type === "Debit" ? "Debit" : "Credit" // Correct: Debit CSV = DR Bank = Debit Voucher

        const voucher = await sql`
          INSERT INTO vouchers (
            voucher_no,
            voucher_type,
            project_id,
            expense_head_id,
            bank_cash_id,
            date,
            amount,
            particulars,
            is_confirmed
          ) VALUES (
            ${voucherNo},
            ${voucherType},
            ${projectId},
            ${accountHeadId || 1},
            ${null},
            ${transactionDate},
            ${amount},
            ${`[LEGACY] ${description || ""} - Vendor: ${vendorName || "Unknown"}`},
            true
          )
          RETURNING id
        `
        const voucherId = voucher[0].id
        voucherCount++

        // Insert as payment transaction marked as legacy with voucher link
        await sql`
          INSERT INTO payment_transactions (
            payment_number,
            vendor_id,
            project_id,
            payment_date,
            payment_type,
            payment_method,
            amount,
            payment_status,
            voucher_id,
            remarks,
            is_active
          ) VALUES (
            ${paymentNumber},
            ${vendorId || null},
            ${projectId},
            ${transactionDate},
            ${type === "Debit" ? "Customer Receipt" : "Vendor Payment"},
            'Legacy Import',
            ${amount},
            'Completed',
            ${voucherId},
            ${`[LEGACY] ${description || ""} - ${txn["Memo / Note/ Comments"] || ""}`},
            true
          )
        `

        if (type === "Debit") {
          totalDebit += amount
        } else {
          totalCredit += amount
        }

        transactionCount++
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`)
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ IMPORT COMPLETE`)
    console.log(`${'='.repeat(60)}`)
    console.log(`📈 Transactions imported: ${transactionCount}`)
    console.log(`� Vouchers created: ${voucherCount}`)
    console.log(`💰 Total Debit (Sales): ৳${totalDebit.toLocaleString()}`)
    console.log(`💳 Total Credit (Purchases): ৳${totalCredit.toLocaleString()}`)
    console.log(`📊 Net: ৳${(totalDebit - totalCredit).toLocaleString()}`)

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered (${errors.length}):`)
      errors.forEach((err) => console.log(`   ${err}`))
    }

    console.log(`\n✅ All legacy transactions have been imported with corresponding vouchers.`)
    console.log(`📋 Vouchers are now visible in Debit/Credit Voucher reports.`)
    console.log(`ℹ️  They are marked as "Legacy Import" and will not interfere with new PO workflow.`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Import failed:", error)
    process.exit(1)
  }
}

importLegacyTransactions()
