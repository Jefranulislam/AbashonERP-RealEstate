import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

async function run() {
  const { sql } = await import("../lib/db")

  const byType = await sql`
    SELECT canonical_type, COUNT(*)::int AS count
    FROM (
      SELECT
        CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END AS canonical_type
      FROM vouchers
    ) t
    GROUP BY canonical_type
    ORDER BY canonical_type NULLS LAST
  `

  const unknownTypes = await sql`
    SELECT voucher_type, COUNT(*)::int AS count
    FROM vouchers
    WHERE CASE
      WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
      WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
      WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
      WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
      ELSE NULL
    END IS NULL
    GROUP BY voucher_type
    ORDER BY count DESC, voucher_type
  `

  const prefixMismatches = await sql`
    SELECT id, voucher_no, voucher_type
    FROM vouchers
    WHERE CASE
      WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
      WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
      WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
      WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
      ELSE NULL
    END IS NOT NULL
      AND (
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Credit' AND voucher_no NOT LIKE 'CR-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Debit' AND voucher_no NOT LIKE 'DV-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Journal' AND voucher_no NOT LIKE 'JV-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Contra' AND voucher_no NOT LIKE 'CV-%')
      )
    ORDER BY id
    LIMIT 20
  `

  const totalMismatches = await sql`
    SELECT COUNT(*)::int AS total
    FROM vouchers
    WHERE CASE
      WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
      WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
      WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
      WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
      ELSE NULL
    END IS NOT NULL
      AND (
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Credit' AND voucher_no NOT LIKE 'CR-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Debit' AND voucher_no NOT LIKE 'DV-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Journal' AND voucher_no NOT LIKE 'JV-%') OR
        (CASE
          WHEN LOWER(TRIM(voucher_type)) IN ('credit', 'cr') THEN 'Credit'
          WHEN LOWER(TRIM(voucher_type)) IN ('debit', 'dr', 'dv') THEN 'Debit'
          WHEN LOWER(TRIM(voucher_type)) IN ('journal', 'jr', 'jv') THEN 'Journal'
          WHEN LOWER(TRIM(voucher_type)) IN ('contra', 'cv') THEN 'Contra'
          ELSE NULL
        END = 'Contra' AND voucher_no NOT LIKE 'CV-%')
      )
  `

  console.log("=== Voucher Consistency Check ===")
  console.log("\n1) Canonical type distribution:")
  console.table(byType)

  console.log("\n2) Unknown/unmapped voucher_type values:")
  if (unknownTypes.length === 0) {
    console.log("None")
  } else {
    console.table(unknownTypes)
  }

  console.log("\n3) Voucher number prefix mismatches:")
  console.log(`Total mismatches: ${totalMismatches[0]?.total ?? 0}`)
  if (prefixMismatches.length > 0) {
    console.table(prefixMismatches)
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Consistency check failed", error)
    process.exit(1)
  })
