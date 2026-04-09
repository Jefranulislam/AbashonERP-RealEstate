import "dotenv/config"
import { sql } from "../lib/db"

async function cleanup() {
  try {
    console.log("🗑️  Cleaning up old legacy imports...")

    // Delete all legacy payment transactions
    await sql`
      DELETE FROM payment_transactions 
      WHERE payment_method = 'Legacy Import' OR remarks LIKE ${'%LEGACY%'}
    `
    console.log("✅ Deleted legacy payment transactions")

    // Delete all legacy vouchers
    await sql`
      DELETE FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'}
    `
    console.log("✅ Deleted legacy vouchers")

    console.log("\n✅ Cleanup complete! Ready for fresh import.")
    process.exit(0)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

cleanup()
