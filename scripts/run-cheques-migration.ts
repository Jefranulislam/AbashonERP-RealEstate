import { sql } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  try {
    console.log('Running cheques table enhancement migration...')
    
    const migrationPath = path.join(__dirname, '005_enhance_cheques_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...')
        await sql(statement)
      }
    }
    
    console.log('✓ Migration completed successfully!')
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
