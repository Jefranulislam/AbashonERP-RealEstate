#!/usr/bin/env node

/**
 * Run Migration 018: Add Reference Party Fields
 * 
 * This script applies the reference party enhancement to payment_transactions,
 * vouchers, and advance_payables tables.
 * 
 * Usage: ts-node scripts/run-018-reference-party-migration.ts
 */

import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable not set')
  process.exit(1)
}

async function runMigration() {
  const pool = new Pool({ connectionString })

  try {
    console.log('🔄 Starting Migration 018: Add Reference Party Fields...\n')

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '018_add_reference_party_fields.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split by statement
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    let executedCount = 0

    for (const statement of statements) {
      try {
        console.log(`⏳ Executing: ${statement.substring(0, 60)}...`)
        await pool.query(statement)
        executedCount++
        console.log('✅ Success\n')
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log('⚠️  Already exists (skipping)\n')
        } else {
          console.error('❌ Error:', error.message)
          throw error
        }
      }
    }

    console.log('\n✅ Migration 018 completed successfully!')
    console.log(`📊 ${executedCount} statements executed\n`)

    // Verify migration
    console.log('🔍 Verifying migration...\n')

    // Check payment_transactions columns
    const ptColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions'
      AND column_name LIKE '%reference_party%'
    `)
    console.log('payment_transactions columns:', ptColumns.rows.length)
    ptColumns.rows.forEach((row) => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`)
    })

    // Check vouchers columns
    const vColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vouchers'
      AND column_name IN ('vendor_id', 'reference_party_type', 'reference_party_name')
    `)
    console.log('\nvouchers columns:', vColumns.rows.length)
    vColumns.rows.forEach((row) => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`)
    })

    // Check reference_party_types table
    const rptCount = await pool.query('SELECT COUNT(*) FROM reference_party_types')
    console.log(`\nreference_party_types records: ${rptCount.rows[0].count}`)

    console.log('\n✨ Migration verification complete!\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run migration
runMigration()
