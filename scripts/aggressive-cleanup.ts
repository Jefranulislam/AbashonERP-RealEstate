import "dotenv/config"
import { sql } from "../lib/db"

async function aggressiveCleanup() {
  try {
    console.log("🗑️  AGGRESSIVE CLEANUP - Removing ALL legacy imports...")

    // First, find and show what's there
    const legacyPayments = await sql`
      SELECT COUNT(*) as count, MIN(payment_number) as first_payment, MAX(payment_number) as last_payment
      FROM payment_transactions 
      WHERE remarks LIKE ${'%LEGACY%'} OR payment_method = 'Legacy Import' OR payment_number LIKE ${'LEGACY-%'}
    `
    console.log(`📊 Found ${legacyPayments[0]?.count || 0} legacy payment transactions`)

    const legacyVouchers = await sql`
      SELECT COUNT(*) as count, MIN(voucher_no) as first_voucher, MAX(voucher_no) as last_voucher
      FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'} OR particulars LIKE ${'%Legacy Import%'}
    `
    console.log(`📊 Found ${legacyVouchers[0]?.count || 0} legacy vouchers`)

    // Delete payment transactions FIRST (they reference vouchers via foreign key)
    await sql`
      DELETE FROM payment_transactions 
      WHERE remarks LIKE ${'%LEGACY%'} OR payment_method = 'Legacy Import' OR payment_number LIKE ${'LEGACY-%'}
    `
    console.log("✅ Deleted all legacy payment transactions")

    // Then delete vouchers
    await sql`
      DELETE FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'} OR particulars LIKE ${'%Legacy Import%'}
    `
    console.log("✅ Deleted all legacy vouchers")

    // Verify cleanup
    const checkPayments = await sql`
      SELECT COUNT(*) as count FROM payment_transactions 
      WHERE remarks LIKE ${'%LEGACY%'} OR payment_method = 'Legacy Import' OR payment_number LIKE ${'LEGACY-%'}
    `
    const checkVouchers = await sql`
      SELECT COUNT(*) as count FROM vouchers 
      WHERE particulars LIKE ${'%LEGACY%'} OR particulars LIKE ${'%Legacy Import%'}
    `

    console.log(`\n🔍 Verification:`)
    console.log(`   Remaining legacy payments: ${checkPayments[0]?.count || 0}`)
    console.log(`   Remaining legacy vouchers: ${checkVouchers[0]?.count || 0}`)

    if ((checkPayments[0]?.count || 0) === 0 && (checkVouchers[0]?.count || 0) === 0) {
      console.log("\n✅ COMPLETE CLEANUP SUCCESSFUL!")
      console.log("   Ready for fresh import.")
    }

    process.exit(0)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

aggressiveCleanup()
