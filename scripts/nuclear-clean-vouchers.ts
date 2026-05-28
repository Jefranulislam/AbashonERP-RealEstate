import * as dotenv from "dotenv"
import * as path from "path"

// Load env from current directory
const envPath = path.resolve(".env.local")
dotenv.config({ path: envPath })

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables")
  process.exit(1)
}

// Import neon directly
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function nuclearClean() {
  try {
    console.log("🔥 Starting nuclear clean of vouchers and related data...")

    // Delete all dependent records in order
    console.log("Deleting payment_history...")
    await sql`DELETE FROM payment_history`

    console.log("Deleting sale_payments...")
    await sql`DELETE FROM sale_payments`

    console.log("Deleting payment_transactions...")
    await sql`DELETE FROM payment_transactions`

    console.log("Deleting journal_voucher_details...")
    await sql`DELETE FROM journal_voucher_details`

    console.log("Deleting vouchers...")
    await sql`DELETE FROM vouchers`

    // Reset sequences to 1
    console.log("Resetting sequences...")
    await sql`ALTER SEQUENCE vouchers_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE journal_voucher_details_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE sale_payments_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE payment_transactions_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE payment_history_id_seq RESTART WITH 1`

    console.log("✅ Nuclear clean completed successfully!")
    console.log("All vouchers and related records deleted.")
    console.log("All sequences reset to 1.")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error during nuclear clean:", error)
    process.exit(1)
  }
}

nuclearClean()
