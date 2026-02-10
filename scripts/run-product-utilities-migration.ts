import { sql } from "../lib/db"

async function runMigration() {
  console.log("Starting product types and utilities migration...")

  try {
    // 1. Add product_types to settings
    console.log("1. Adding product_types to settings...")
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS product_types TEXT DEFAULT 'Residential,Commercial,Apartment,Studio,Parking,Gas Line,Others'`
    console.log("   ✓ product_types column added")

    // 2. Enhance products table
    console.log("2. Enhancing products table...")
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS rate_per_sqft DECIMAL(15, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS utility_charge DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS size DECIMAL(10, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS calculated_price DECIMAL(15, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(100)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(15, 2)`
    console.log("   ✓ Products table enhanced")

    // 3. Create sale_additional_items table
    console.log("3. Creating sale_additional_items table...")
    await sql`
      CREATE TABLE IF NOT EXISTS sale_additional_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        item_type VARCHAR(50) NOT NULL,
        item_name VARCHAR(255),
        description TEXT,
        base_price DECIMAL(15, 2) NOT NULL,
        discount_amount DECIMAL(15, 2) DEFAULT 0,
        net_price DECIMAL(15, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("   ✓ sale_additional_items table created")

    // 4. Add indexes
    console.log("4. Adding indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_additional_items_sale_id ON sale_additional_items(sale_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_additional_items_type ON sale_additional_items(item_type)`
    console.log("   ✓ Indexes added")

    // 5. Enhance sales table
    console.log("5. Enhancing sales table...")
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS flat_price DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS utility_charge DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS parking_total DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS gas_line_total DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS other_charges DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_gross_price DECIMAL(15, 2)`
    console.log("   ✓ Sales table enhanced")

    // 6. Enhance payment schedules
    console.log("6. Enhancing payment schedules...")
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS payment_label VARCHAR(255)`
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS percentage DECIMAL(5, 2)`
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS due_month INTEGER`
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS due_year INTEGER`
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false`
    await sql`ALTER TABLE sale_payment_schedules ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`
    console.log("   ✓ Payment schedules enhanced")

    console.log("\n✅ Migration completed successfully!")

  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
