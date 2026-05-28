import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" })
}

import { buildVoucherNo, normalizeVoucherType, type VoucherType } from "../lib/voucher-utils"

async function normalizeVoucherNumbers() {
  const { sql } = await import("../lib/db")

  const vouchers = await sql`
    SELECT id, voucher_no, voucher_type, date, created_at
    FROM vouchers
    ORDER BY date, created_at, id
  `

  const counters: Record<VoucherType, number> = {
    Credit: 0,
    Debit: 0,
    Journal: 0,
    Contra: 0,
  }

  let updated = 0
  let typeUpdated = 0

  for (const v of vouchers) {
    const rawType = String(v.voucher_type ?? "")
    const type = normalizeVoucherType(rawType)
    if (!type) {
      continue
    }

    if (rawType !== type) {
      await sql`UPDATE vouchers SET voucher_type = ${type} WHERE id = ${v.id}`
      typeUpdated += 1
    }

    counters[type] += 1
    const year = v.date ? new Date(v.date).getFullYear() : new Date(v.created_at).getFullYear()
    const normalized = buildVoucherNo(type, counters[type], year)

    if (v.voucher_no !== normalized) {
      await sql`UPDATE vouchers SET voucher_no = ${normalized} WHERE id = ${v.id}`
      updated += 1
    }
  }

  console.log(`Normalized voucher data. Type updated: ${typeUpdated}, Number updated: ${updated}`)
}

normalizeVoucherNumbers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed to normalize voucher numbers", e)
    process.exit(1)
  })
