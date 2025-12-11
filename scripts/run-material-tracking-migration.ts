import postgres from "postgres";
import fs from "fs";
import path from "path";

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("========================================");
    console.log("Material Purchase & Payment Tracking Migration");
    console.log("========================================\n");
    
    console.log("Reading migration file...");
    const migrationPath = path.join(process.cwd(), "scripts", "008_material_purchase_payment_tracking.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    console.log("Executing migration...\n");
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log("\n========================================");
    console.log("✅ Migration completed successfully!");
    console.log("========================================\n");
    
    console.log("Verifying created tables...");
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'purchase_orders',
        'purchase_order_items',
        'material_deliveries',
        'payment_schedules',
        'payment_transactions',
        'payment_history'
      )
      ORDER BY table_name
    `;
    
    console.log("\nCreated Tables:");
    tables.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });
    
    // Verify views were created
    const views = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'vw_po_summary',
        'vw_material_purchase_summary',
        'vw_pending_payments'
      )
      ORDER BY table_name
    `;
    
    console.log("\nCreated Views:");
    views.forEach(view => {
      console.log(`  ✓ ${view.table_name}`);
    });
    
    // Check triggers
    const triggers = await sql`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND trigger_name IN (
        'trigger_update_po_delivery',
        'trigger_update_schedule',
        'trigger_update_po_status'
      )
      ORDER BY trigger_name
    `;
    
    console.log("\nCreated Triggers:");
    triggers.forEach(trigger => {
      console.log(`  ✓ ${trigger.trigger_name} on ${trigger.event_object_table}`);
    });
    
    console.log("\n========================================");
    console.log("Next Steps:");
    console.log("  1. Create API endpoints for:");
    console.log("     - Purchase Orders");
    console.log("     - Material Deliveries");
    console.log("     - Payment Transactions");
    console.log("  2. Build UI pages");
    console.log("  3. Test complete workflow");
    console.log("========================================\n");
    
    await sql.end();
    
  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
