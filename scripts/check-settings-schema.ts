import { neon } from '@neondatabase/serverless'

// Use fallback DATABASE_URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

async function checkSettingsTable() {
  console.log('🔍 Checking settings table structure...')
  
  try {
    // Check if the table exists and get its structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      ORDER BY ordinal_position
    `
    
    console.log('📋 Settings table columns:')
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check specifically for our new columns
    const imageColumns = ['company_logo', 'footer_image', 'background_image']
    const missingColumns = imageColumns.filter(colName => 
      !columns.some(col => col.column_name === colName)
    )
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns.join(', '))
      console.log('🔧 Adding missing columns...')
      
      for (const col of missingColumns) {
        await (sql as any)(`ALTER TABLE settings ADD COLUMN "${col}" TEXT`)
        console.log(`✅ Added ${col}`)
      }
    } else {
      console.log('✅ All image columns exist!')
    }
    
    // Test inserting/updating with image data
    console.log('🧪 Testing settings operations...')
    
    const testSettings = await sql`
      SELECT * FROM settings ORDER BY id DESC LIMIT 1
    `
    
    if (testSettings.length > 0) {
      console.log(`📝 Found ${testSettings.length} settings record(s)`)
      console.log('✅ Settings table is accessible!')
    } else {
      console.log('⚠️ No settings records found - this might be expected for a new installation')
    }
    
  } catch (error) {
    console.error('❌ Error checking settings table:', error)
  }
}

// Run the check
checkSettingsTable()
  .then(() => {
    console.log('✅ Check completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Check failed:', error)
    process.exit(1)
  })