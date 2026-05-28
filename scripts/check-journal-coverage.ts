import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

async function run() {
  const { sql } = await import("../lib/db")

  const totalRows = await sql`
    SELECT COUNT(*)::int AS total_journal
    FROM vouchers
    WHERE voucher_type = 'Journal'
  `

  const detailRows = await sql`
    SELECT COUNT(DISTINCT voucher_id)::int AS journal_with_details
    FROM journal_voucher_details
  `

  console.log({
    totalJournal: totalRows[0]?.total_journal ?? 0,
    journalWithDetails: detailRows[0]?.journal_with_details ?? 0,
  })
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed to check journal coverage", e)
    process.exit(1)
  })
