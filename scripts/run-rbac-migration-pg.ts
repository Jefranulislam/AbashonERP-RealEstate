import { Client } from "pg"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

if (!process.env.DATABASE_URL) {
  console.error("\n❌ ERROR: DATABASE_URL environment variable is not set")
  console.error("\n📝 Please create a .env.local file in the root directory with:")
  console.error("   DATABASE_URL=your_database_connection_string")
  process.exit(1)
}

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log("🚀 Starting Role-Based Access Control (RBAC) migration...")
    console.log("🔗 Connecting to database...")
    
    await client.connect()
    console.log("✅ Connected to database\n")

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, "011_add_roles_and_permissions.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    console.log("⚙️  Executing RBAC migration SQL...\n")
    
    // Execute the entire SQL file
    await client.query(migrationSQL)
    
    console.log("✅ Migration executed successfully!\n")

    console.log("✨ RBAC Migration completed successfully!\n")
    console.log("📊 Summary:")
    console.log("  ✓ Roles table created")
    console.log("  ✓ Modules table created")
    console.log("  ✓ Permissions table created")
    console.log("  ✓ Role permissions table created")
    console.log("  ✓ Employees table updated with role_id")
    console.log("  ✓ Users table updated with role_id")
    console.log("  ✓ Default permissions inserted")
    console.log("  ✓ Default modules inserted (40+ modules)")
    console.log("  ✓ Default roles inserted (7 roles)")
    console.log("  ✓ Admin role permissions configured")
    console.log("  ✓ Manager role permissions configured")
    console.log("  ✓ Accountant role permissions configured")
    console.log("  ✓ Sales Executive role permissions configured")
    console.log("  ✓ Purchase Officer role permissions configured")
    console.log("  ✓ HR Manager role permissions configured")
    console.log("  ✓ Viewer role permissions configured")
    console.log("  ✓ Audit log table created")
    console.log("\n🎉 You can now use the Role Manager at /dashboard/role-manager")

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message)
    console.error("\nDetails:", error)
    process.exit(1)
  } finally {
    await client.end()
    console.log("\n✅ Database connection closed")
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("\n✅ Migration script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error)
    process.exit(1)
  })
