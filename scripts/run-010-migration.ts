import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL)

async function runMigration() {
  try {
    console.log('Running bank and categories migration...')
    
    const migrationPath = path.join(__dirname, '010_add_bank_and_categories.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')
    
    await sql.unsafe(migration)
    
    console.log('✅ Migration completed successfully!')
    await sql.end()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
