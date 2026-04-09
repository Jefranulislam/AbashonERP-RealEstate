import "dotenv/config"
import { sql } from "../lib/db"

async function checkAndClean() {
  try {
    console.log("🔍 Checking database state...")

    // Count ALL payment transactions
    const allPayments = await sql`
      SELECT COUNT(*) as count FROM payment_transactions 
    `
    console.log(`\n📊 TOTAL payment transactions: ${allPayments[0]?.count || 0}`)

    // Count legacy (marked) payments
    const legacyMarked = await sql`
      SELECT COUNT(*) as count FROM payment_transactions 
      WHERE remarks LIKE ${'%LEGACY%'} OR payment_method = 'Legacy Import'
    `
    console.log(`   Legacy marked: ${legacyMarked[0]?.count || 0}`)

    // Count all vouchers
    const allVouchers = await sql`
      SELECT COUNT(*) as count FROM vouchers 
    `
    console.log(`   TOTAL vouchers: ${allVouchers[0]?.count || 0}`)

    // Count legacy vouchers
    const legacyVouchers = await sql`
      SELECT COUNT(*) as count FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'}
    `
    console.log(`   Legacy vouchers: ${legacyVouchers[0]?.count || 0}`)

    // Show some sample payment numbers to understand structure
    const samples = await sql`
      SELECT DISTINCT payment_number FROM payment_transactions 
      ORDER BY payment_number DESC LIMIT 10
    `
    console.log(`\n📋 Latest payment numbers:`)
    samples.forEach((s: any) => console.log(`   ${s.payment_number}`))

    console.log(`\n⚠️  Deleting ALL Legacy Import records...`)

    // Delete all payments with Legacy Import method
    await sql`
      DELETE FROM payment_transactions 
      WHERE payment_method = 'Legacy Import'
    `

    // Delete all legacy marked vouchers
    await sql`
      DELETE FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'}
    `

    // Verify after deletion
    const finalPayments = await sql`
      SELECT COUNT(*) as count FROM payment_transactions 
    `
    const finalVouchers = await sql`
      SELECT COUNT(*) as count FROM vouchers 
    `

    console.log(`\n✅ After cleanup:`)
    console.log(`   Payment transactions: ${finalPayments[0]?.count || 0}`)
    console.log(`   Vouchers: ${finalVouchers[0]?.count || 0}`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkAndClean()
