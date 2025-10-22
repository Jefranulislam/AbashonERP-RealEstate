const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sql = neon(DATABASE_URL);
  
  try {
    console.log("Reading SQL schema file...");
    const schemaPath = path.join(__dirname, "001_create_database_schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    
    console.log("Executing schema...");
    await sql(schema);
    
    console.log("✅ Database schema initialized successfully!");
    console.log("✅ All tables created!");
    
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
