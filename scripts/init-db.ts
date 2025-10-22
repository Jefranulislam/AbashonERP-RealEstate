import postgres from "postgres";
import fs from "fs";
import path from "path";

async function initializeDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("Reading SQL schema file...");
    const schemaPath = path.join(process.cwd(), "scripts", "001_create_database_schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    
    console.log("Executing schema...");
    
    // Execute the schema using postgres.js unsafe method
    await sql.unsafe(schema);
    
    console.log("✅ Database schema initialized successfully!");
    console.log("✅ All tables created!");
    
    await sql.end();
    
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
