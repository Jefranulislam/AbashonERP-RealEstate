import { neon } from '@neondatabase/serverless';

// Make sure to set your DATABASE_URL in environment or directly here for migration
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Please set DATABASE_URL environment variable');
  console.log('Run: $env:DATABASE_URL="your_database_url" ; npx tsx scripts/apply-currency-migration.ts');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function applyCurrencyMigration() {

  try {
    console.log('Applying currency settings migration...');

    // Add currency_code column
    await sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'BDT'
    `;
    console.log('✅ Added currency_code column');

    // Add currency_symbol column
    await sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '৳'
    `;
    console.log('✅ Added currency_symbol column');

    // Update existing records
    await sql`
      UPDATE settings 
      SET currency_code = 'BDT', currency_symbol = '৳' 
      WHERE currency_code IS NULL
    `;
    console.log('✅ Updated existing records with default currency');

    console.log('✅ Currency settings migration completed successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyCurrencyMigration();
