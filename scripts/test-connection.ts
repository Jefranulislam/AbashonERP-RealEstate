import postgres from "postgres";

async function testConnection() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("🔍 Testing database connection...\n");
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log("✅ Database connection successful!");
    console.log("   Current time:", result[0].current_time);
    console.log("");
    
    // Check tables
    console.log("📋 Checking tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
    console.log("");
    
    // Check users
    console.log("👥 Checking users...");
    const users = await sql`SELECT id, email, name FROM users`;
    console.log(`   Found ${users.length} user(s):`);
    users.forEach((user: any) => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    console.log("");
    
    // Check settings
    console.log("⚙️  Checking settings...");
    const settings = await sql`SELECT * FROM settings LIMIT 1`;
    if (settings.length > 0) {
      console.log("   Company Name:", settings[0].company_name);
      console.log("   Invoice Prefix:", settings[0].invoice_prefix);
    }
    console.log("");
    
    console.log("✨ All checks passed! Your ERP system is ready to use.");
    console.log("");
    console.log("🚀 Next steps:");
    console.log("   1. Start the dev server: pnpm dev");
    console.log("   2. Open http://localhost:3000");
    console.log("   3. Login with: admin@admin.com / admin123");
    
    await sql.end();
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testConnection();
