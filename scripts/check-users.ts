// Check users in database
import postgres from "postgres"

const sql = postgres("postgresql://neondb_owner:npg_apQ6ibO3rovB@ep-jolly-surf-ad99ezml-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function checkUsers() {
  try {
    const users = await sql`
      SELECT id, email, name, created_at 
      FROM users 
      WHERE deleted_at IS NULL
      LIMIT 10
    `
    console.log('Users in database:')
    if (users.length === 0) {
      console.log('  (No users found)')
    } else {
      users.forEach((u: any) => console.log(`  - ${u.id}: ${u.name} (${u.email})`))
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await sql.end()
  }
}

checkUsers()
