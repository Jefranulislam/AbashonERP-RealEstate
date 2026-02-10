import { sql } from '../lib/db'

async function runMigration() {
  console.log('Starting migration: Add terms_conditions column to sales...')

  try {
    // Add the column if it doesn't exist
    await sql`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS terms_conditions TEXT
    `
    console.log('✓ Added terms_conditions column')

    // Set default terms for existing sales
    const defaultTerms = `This booking is subject to the terms mentioned in the final agreement.
Down payment must be made within 30 days of booking.
Monthly installments will start from the 2nd month after booking.
Delay in payment may attract late fee as per company policy.
Registration and other government charges are extra.
Handover date is tentative and subject to construction progress.`

    const result = await sql`
      UPDATE sales 
      SET terms_conditions = ${defaultTerms}
      WHERE terms_conditions IS NULL
      RETURNING id
    `
    console.log(`✓ Updated ${result.length} sales with default terms`)

    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
