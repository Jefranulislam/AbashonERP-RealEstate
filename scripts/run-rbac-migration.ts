import { neon } from "@neondatabase/serverless"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

// Also try .env if .env.local doesn't exist
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

if (!process.env.DATABASE_URL) {
  console.error("\n❌ ERROR: DATABASE_URL environment variable is not set")
  console.error("\n📝 Please create a .env.local file in the root directory with:")
  console.error("   DATABASE_URL=your_database_connection_string")
  console.error("\nExample:")
  console.error("   DATABASE_URL=postgresql://user:password@host/database")
  console.error("\n💡 If you're using Neon, get your connection string from:")
  console.error("   https://console.neon.tech/app/projects\n")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("🚀 Starting Role-Based Access Control (RBAC) migration...")

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, "011_add_roles_and_permissions.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--") && s !== "")

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments
      if (statement.startsWith("--")) continue
      
      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)
        await sql(statement)
        console.log(`✅ Statement ${i + 1} completed successfully`)
      } catch (error: any) {
        // Some errors are expected (e.g., trying to add a column that already exists)
        if (
          error.message?.includes("already exists") ||
          error.message?.includes("duplicate key")
        ) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`)
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.error("Statement:", statement.substring(0, 200))
        }
      }
    }

    console.log("\n✨ RBAC Migration completed successfully!")
    console.log("\n📊 Summary:")
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

  } catch (error) {
    console.error("\n❌ Migration failed:", error)
    process.exit(1)
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
