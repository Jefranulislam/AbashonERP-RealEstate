import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set")
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL as string
const sql = neon(databaseUrl)

async function verifyTables() {
  console.log("🔍 Checking RBAC tables...\n")

  try {
    // Check roles table
    console.log("1. Checking roles table...")
    const roles = await sql`SELECT COUNT(*) as count FROM roles`
    console.log(`   ✅ Roles table exists with ${roles[0].count} roles\n`)

    // Check modules table
    console.log("2. Checking modules table...")
    const modules = await sql`SELECT COUNT(*) as count FROM modules`
    console.log(`   ✅ Modules table exists with ${modules[0].count} modules\n`)

    // Check permissions table
    console.log("3. Checking permissions table...")
    const permissions = await sql`SELECT COUNT(*) as count FROM permissions`
    console.log(`   ✅ Permissions table exists with ${permissions[0].count} permissions\n`)

    // Check role_permissions table
    console.log("4. Checking role_permissions table...")
    const rolePerms = await sql`SELECT COUNT(*) as count FROM role_permissions`
    console.log(`   ✅ Role_permissions table exists with ${rolePerms[0].count} mappings\n`)

    // Check if employees has role_id column
    console.log("5. Checking employees table for role_id column...")
    const empCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'role_id'
    `
    if (empCheck.length > 0) {
      console.log("   ✅ Employees table has role_id column\n")
    } else {
      console.log("   ⚠️  Employees table missing role_id column\n")
    }

    // List all roles
    console.log("6. Current roles in database:")
    const roleList = await sql`SELECT role_name FROM roles WHERE deleted_at IS NULL ORDER BY role_name`
    roleList.forEach((r: any) => {
      console.log(`   - ${r.role_name}`)
    })

    console.log("\n✅ All RBAC tables verified successfully!")
    console.log("\n🌐 DATABASE_URL being used:")
    console.log(`   ${databaseUrl.substring(0, 50)}...`)

  } catch (error: any) {
    console.error("\n❌ Error verifying tables:", error.message)
    console.error("\nThis means the RBAC tables don't exist in this database.")
    console.error("\n💡 Solution:")
    console.error("   1. Make sure your DATABASE_URL points to the correct database")
    console.error("   2. Run: npx tsx scripts/run-rbac-migration.ts")
    process.exit(1)
  }
}

verifyTables()
