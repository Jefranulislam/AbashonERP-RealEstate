import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function checkColumns() {
  try {
    // Check if sale_additional_items table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'sale%'
      ORDER BY table_name
    `
    console.log('Sale-related tables:')
    tables.forEach((t: any) => console.log('  -', t.table_name))
    
    const hasAdditionalItems = tables.some((t: any) => t.table_name === 'sale_additional_items')
    console.log('\nsale_additional_items table:', hasAdditionalItems ? '✓ exists' : '✗ MISSING')
    
    if (hasAdditionalItems) {
      const cols = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sale_additional_items' 
        ORDER BY ordinal_position
      `
      console.log('sale_additional_items columns:')
      cols.forEach((c: any) => console.log('  -', c.column_name))
    }
    
    // Check sale_activities
    const hasActivities = tables.some((t: any) => t.table_name === 'sale_activities')
    console.log('\nsale_activities table:', hasActivities ? '✓ exists' : '✗ MISSING')
    
    // Check sale_payments
    const hasPayments = tables.some((t: any) => t.table_name === 'sale_payments')
    console.log('sale_payments table:', hasPayments ? '✓ exists' : '✗ MISSING')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkColumns().then(() => process.exit(0)).catch(() => process.exit(1))
