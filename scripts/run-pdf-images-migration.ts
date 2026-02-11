import { neon } from '@neondatabase/serverless'

// Use fallback DATABASE_URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(DATABASE_URL)

async function runPdfImagesMigration() {
  console.log('🚀 Running PDF images migration...')

  try {
    // Add PDF image customization fields
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo TEXT`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_image TEXT`  
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS background_image TEXT`

    // Add comments  
    await sql`COMMENT ON COLUMN settings.company_logo IS 'Stores the base64 encoded logo image for PDF headers'`
    await sql`COMMENT ON COLUMN settings.footer_image IS 'Stores the base64 encoded footer image for PDFs'`
    await sql`COMMENT ON COLUMN settings.background_image IS 'Stores the base64 encoded background graphic for left side of PDFs'`

    // Create index for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_settings_images ON settings(company_logo, footer_image, background_image)`

    console.log('✅ PDF images migration completed successfully!')
  } catch (error) {
    console.error('❌ Error running PDF images migration:', error)
    throw error
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  runPdfImagesMigration()
    .then(() => {
      console.log('Migration finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default runPdfImagesMigration