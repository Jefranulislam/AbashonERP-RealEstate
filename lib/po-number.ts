import { sql } from "@/lib/db"

/**
 * Purchase order numbering — single continuing sequence.
 * Format: PO2{counter}, zero-padded to 4 digits, e.g. PO20198.
 * Continues from the highest existing PO number (imported data ends at PO20197),
 * so the next PO is always max + 1 regardless of project.
 */

const PREFIX = "PO2"
const PAD = 4

export function buildPoNumber(counter: number): string {
  return `${PREFIX}${String(counter).padStart(PAD, "0")}`
}

/**
 * Next PO number: highest existing counter + 1.
 * Concurrency is guarded by the UNIQUE constraint on po_number — callers retry on conflict.
 */
export async function getNextPoNumber(): Promise<string> {
  const rows = await sql`
    SELECT po_number FROM purchase_orders WHERE po_number LIKE ${PREFIX + "%"}
  `
  let max = 0
  for (const r of rows) {
    const counter = parseInt(String(r.po_number).slice(PREFIX.length), 10)
    if (Number.isFinite(counter) && counter > max) max = counter
  }
  return buildPoNumber(max + 1)
}

/** True when an error is a Postgres unique-violation (duplicate po_number under a race). */
export function isUniqueViolation(error: unknown): boolean {
  return Boolean(error) && (error as { code?: string }).code === "23505"
}
