import { sql } from "@/lib/db"

export async function ensureAccountCodeSchema() {
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

  await sql`
    ALTER TABLE income_expense_heads
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES income_expense_heads(id) ON DELETE CASCADE
  `

  await sql`
    ALTER TABLE income_expense_heads
    ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false
  `

  await sql`
    ALTER TABLE income_expense_heads
    ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0
  `

  await sql`
    ALTER TABLE income_expense_heads
    ADD COLUMN IF NOT EXISTS full_path TEXT
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_income_expense_heads_parent_id
    ON income_expense_heads(parent_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_income_expense_heads_is_group
    ON income_expense_heads(is_group)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_income_expense_heads_level
    ON income_expense_heads(level)
  `

  await sql`
    CREATE OR REPLACE FUNCTION update_expense_head_path()
    RETURNS TRIGGER AS $$
    DECLARE
      parent_path TEXT;
    BEGIN
      IF NEW.parent_id IS NULL THEN
        NEW.full_path := NEW.head_name;
        NEW.level := 0;
      ELSE
        SELECT full_path, level INTO parent_path, NEW.level
        FROM income_expense_heads
        WHERE id = NEW.parent_id;

        NEW.full_path := parent_path || ' > ' || NEW.head_name;
        NEW.level := COALESCE(NEW.level, 0) + 1;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `

  await sql`
    DROP TRIGGER IF EXISTS trigger_update_expense_head_path ON income_expense_heads
  `

  await sql`
    CREATE TRIGGER trigger_update_expense_head_path
    BEFORE INSERT OR UPDATE OF head_name, parent_id
    ON income_expense_heads
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_head_path()
  `

  const duplicateRows = await sql`
    SELECT account_code
    FROM income_expense_heads
    WHERE account_code IS NOT NULL
    GROUP BY account_code
    HAVING COUNT(*) > 1
    LIMIT 1
  `

  if (duplicateRows.length === 0) {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_income_expense_heads_account_code
      ON income_expense_heads(account_code)
    `
  } else {
    console.warn("Duplicate account_code values exist; skipping unique index bootstrap until they are cleaned up.")
  }

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_income_exp_heads_account_code_format'
      ) THEN
        ALTER TABLE income_expense_heads
          ADD CONSTRAINT chk_income_exp_heads_account_code_format
          CHECK (account_code IS NULL OR account_code ~ '^[0-9]{4}$') NOT VALID;
      END IF;
    END$$
  `

}

export async function getNextAccountCode() {
  const rows = await sql`
    SELECT COALESCE(MAX(account_code::int), 999) AS max_code
    FROM income_expense_heads
    WHERE account_code ~ '^[0-9]{4}$'
  `

  const maxCode = rows?.[0]?.max_code
  const next = Number(maxCode || 999) + 1

  if (next > 9999) {
    throw new Error("No available 4-digit account codes")
  }

  return String(next).padStart(4, "0")
}
