import postgres from "postgres";
import fs from "fs";
import path from "path";

async function updateSchema() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("Reading SQL update file...");
    const schemaPath = path.join(process.cwd(), "scripts", "002_add_users_table.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    
    console.log("Executing schema updates...");
    
    await sql.unsafe(schema);
    
    console.log("✅ Schema updated successfully!");
    console.log("✅ Users table created!");
    console.log("✅ Default admin user created (email: admin@admin.com, password: admin123)");
    
    await sql.end();
    
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    process.exit(1);
  }
}

updateSchema();
