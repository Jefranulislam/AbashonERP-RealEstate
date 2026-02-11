import { neon } from '@neondatabase/serverless'

// Use fallback DATABASE_URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

async function updateImageColumnsForUrls() {
  console.log('🚀 Updating image columns for WordPress URL storage...')

  try {
    // Clear any existing base64 data (it's too large for database anyway)
    await sql`
      UPDATE settings 
      SET 
        company_logo = NULL,
        footer_image = NULL,
        background_image = NULL
      WHERE 
        (company_logo IS NOT NULL AND LENGTH(company_logo) > 500) OR
        (footer_image IS NOT NULL AND LENGTH(footer_image) > 500) OR 
        (background_image IS NOT NULL AND LENGTH(background_image) > 500)
    `

    // Add comments to clarify these columns now store URLs
    await sql`COMMENT ON COLUMN settings.company_logo IS 'WordPress media URL for company logo in PDF headers'`
    await sql`COMMENT ON COLUMN settings.footer_image IS 'WordPress media URL for footer image in PDFs'`
    await sql`COMMENT ON COLUMN settings.background_image IS 'WordPress media URL for background graphic in PDFs'`

    console.log('✅ Image columns updated for WordPress URL storage!')
    console.log('📝 These columns now store WordPress media URLs instead of base64 data')

  } catch (error) {
    console.error('❌ Error updating image columns:', error)
    throw error
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  updateImageColumnsForUrls()
    .then(() => {
      console.log('Migration finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default updateImageColumnsForUrls