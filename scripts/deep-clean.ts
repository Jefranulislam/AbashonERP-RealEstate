import "dotenv/config"
import { sql } from "../lib/db"

async function deepClean() {
  try {
    console.log("🔍 Deep cleanup of orphaned vouchers...")

    // Find vouchers not referenced by any payment transactions
    const orphanedVouchers = await sql`
      SELECT v.id, v.voucher_no, v.particulars
      FROM vouchers v
      LEFT JOIN payment_transactions pt ON pt.voucher_id = v.id
      WHERE pt.id IS NULL
      LIMIT 10
    `
    
    console.log(`\n📋 Sample orphaned vouchers:`)
    orphanedVouchers.forEach((v: any) => {
      console.log(`   ${v.voucher_no}: ${v.particulars}`)
    })

    // Count orphaned
    const orphanCount = await sql`
      SELECT COUNT(*) as count
      FROM vouchers v
      LEFT JOIN payment_transactions pt ON pt.voucher_id = v.id
      WHERE pt.id IS NULL
    `

    console.log(`\n🗑️  Found ${orphanCount[0]?.count || 0} orphaned vouchers`)
    console.log(`   Deleting them...`)

    // Delete orphaned vouchers
    await sql`
      DELETE FROM vouchers v
      WHERE NOT EXISTS (
        SELECT 1 FROM payment_transactions pt 
        WHERE pt.voucher_id = v.id
      )
    `

    // Verify final state
    const finalPayments = await sql`
      SELECT COUNT(*) as count FROM payment_transactions 
    `
    const finalVouchers = await sql`
      SELECT COUNT(*) as count FROM vouchers 
    `

    console.log(`\n✅ FINAL STATE:`)
    console.log(`   Payment transactions: ${finalPayments[0]?.count || 0}`)
    console.log(`   Vouchers: ${finalVouchers[0]?.count || 0}`)
    console.log(`\n✨ Database is CLEAN!`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

deepClean()
