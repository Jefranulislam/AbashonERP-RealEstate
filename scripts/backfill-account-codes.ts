import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

function hasFlag(flagName: string) {
  return process.argv.includes(flagName)
}

async function ensureAccountCodeSchema(sql: any) {
  try {
    await sql`
      ALTER TABLE income_expense_heads
      ADD COLUMN IF NOT EXISTS account_code VARCHAR(4)
    `
    await sql`
      ALTER TABLE income_expense_heads
      ADD COLUMN IF NOT EXISTS head_type VARCHAR(100)
    `
    await sql`
      ALTER TABLE income_expense_heads
      ADD COLUMN IF NOT EXISTS account_category VARCHAR(100)
    `
  } catch (error) {
    console.warn("Warning: Could not ensure account_code schema:", error)
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("\n❌ DATABASE_URL is not set")
    console.error("   Add it to .env.local or .env, then rerun this script.")
    process.exit(1)
  }

  const { default: postgres } = await import("postgres")
  const sql = postgres(process.env.DATABASE_URL)

  const applyChanges = hasFlag("--apply")
  console.log(`\n🔧 Backfilling account codes (${applyChanges ? "apply" : "dry-run"})...`)

  await ensureAccountCodeSchema(sql)

  const rows = await sql`
    WITH RECURSIVE account_tree AS (
      SELECT
        id,
        head_name,
        parent_id,
        COALESCE(level, 0) AS level,
        account_code,
        LPAD(id::text, 10, '0') AS sort_key
      FROM income_expense_heads
      WHERE parent_id IS NULL
         OR parent_id NOT IN (SELECT id FROM income_expense_heads)

      UNION ALL

      SELECT
        child.id,
        child.head_name,
        child.parent_id,
        COALESCE(child.level, parent.level + 1) AS level,
        child.account_code,
        parent.sort_key || '.' || LPAD(child.id::text, 10, '0') AS sort_key
      FROM income_expense_heads child
      JOIN account_tree parent ON child.parent_id = parent.id
    )
    SELECT id, head_name, parent_id, level, account_code, sort_key
    FROM account_tree
    ORDER BY sort_key, id
  `

  if (!rows.length) {
    console.log("No account heads found. Nothing to backfill.")
    return
  }

  const usedCodes = new Set<string>()
  const assignedCodes = new Map<number, string>()
  const duplicateCodes = new Map<string, number[]>()
  const changes: Array<{ id: number; headName: string; oldCode: string | null; newCode: string }> = []

  let nextCodeNumber = 1000

  for (const row of rows) {
    const currentCode = typeof row.account_code === "string" ? row.account_code.trim() : ""
    const isValidCode = /^[0-9]{4}$/.test(currentCode)

    if (isValidCode && !usedCodes.has(currentCode)) {
      usedCodes.add(currentCode)
      assignedCodes.set(row.id, currentCode)
      nextCodeNumber = Math.max(nextCodeNumber, Number(currentCode) + 1)
      continue
    }

    if (isValidCode) {
      const duplicateList = duplicateCodes.get(currentCode) ?? []
      duplicateList.push(row.id)
      duplicateCodes.set(currentCode, duplicateList)
    }

    while (usedCodes.has(String(nextCodeNumber).padStart(4, "0"))) {
      nextCodeNumber += 1
    }

    if (nextCodeNumber > 9999) {
      throw new Error("No available 4-digit account codes remain")
    }

    const newCode = String(nextCodeNumber).padStart(4, "0")
    usedCodes.add(newCode)
    assignedCodes.set(row.id, newCode)
    changes.push({
      id: row.id,
      headName: row.head_name,
      oldCode: isValidCode ? currentCode : null,
      newCode
    })
    nextCodeNumber += 1
  }

  console.log(`Found ${rows.length} account heads.`)
  console.log(`Will update ${changes.length} rows.`)

  if (duplicateCodes.size > 0) {
    console.log("Duplicate existing codes detected:")
    for (const [code, ids] of duplicateCodes.entries()) {
      console.log(`  ${code}: ${ids.join(", ")}`)
    }
  }

  if (!applyChanges) {
    console.log("\nPreview of first 20 changes:")
    for (const change of changes.slice(0, 20)) {
      console.log(`  #${change.id} ${change.headName}: ${change.oldCode ?? "<empty>"} -> ${change.newCode}`)
    }
    console.log("\nRe-run with --apply to commit these updates.")
    return
  }

  try {
    await sql.begin(async (transaction) => {
      for (const change of changes) {
        await transaction`
          UPDATE income_expense_heads
          SET account_code = ${change.newCode}
          WHERE id = ${change.id}
        `
      }
    })

    console.log(`\n✅ Updated ${changes.length} account heads.`)
  } catch (error) {
    await sql.end({ timeout: 5 })
    throw error
  }
}

main().catch((error) => {
  console.error("\n❌ Backfill failed:", error)
  process.exit(1)
})
