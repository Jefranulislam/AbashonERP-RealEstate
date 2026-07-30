#!/usr/bin/env node
/**
 * Run Migration 022: Add contractor (constructor) support to Purchase Orders.
 * Applies scripts/022_add_constructor_to_po.sql as a single batch, then verifies.
 *
 * Usage: pnpm tsx scripts/run-022-constructor-po-migration.ts
 */

import 'dotenv/config'
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
    console.log('🔄 Migration 022: constructor support for purchase_orders...\n')

    const migrationPath = path.join(__dirname, '022_add_constructor_to_po.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Run the whole file in one call (pg simple-query protocol supports multiple
    // statements; no bound params here). Avoids fragile ";"-splitting.
    await pool.query(migrationSQL)
    console.log('✅ SQL applied\n')

    // Verify columns exist
    const cols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'purchase_orders'
        AND column_name IN ('constructor_id', 'party_type')
      ORDER BY column_name
    `)
    console.log('purchase_orders new columns:', cols.rows.length)
    cols.rows.forEach((r) => console.log(`  ✓ ${r.column_name} (${r.data_type})`))

    // Verify view rebuilt with party_name
    const view = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vw_po_summary' AND column_name = 'party_name'
    `)
    console.log(`\nvw_po_summary.party_name present: ${view.rows.length > 0 ? 'yes' : 'no'}`)

    if (cols.rows.length < 2) {
      throw new Error('Expected constructor_id + party_type columns not found after migration')
    }

    console.log('\n✨ Migration 022 complete.\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
