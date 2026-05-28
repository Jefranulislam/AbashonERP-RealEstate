import { sql } from "@/lib/db"

const DEFAULT_PREFIX = "V"
const DEFAULT_START = 1000

let vendorCodeSchemaPromise: Promise<void> | null = null

export async function ensureVendorCodeSchema(): Promise<void> {
  if (!vendorCodeSchemaPromise) {
    vendorCodeSchemaPromise = (async () => {
      await sql`
        ALTER TABLE vendors
        ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(20)
      `

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_vendors_vendor_code
        ON vendors(vendor_code)
      `
    })()
  }

  return vendorCodeSchemaPromise
}

export async function getNextVendorCode(prefix = DEFAULT_PREFIX, start = DEFAULT_START): Promise<string> {
  await ensureVendorCodeSchema()

  const rows = await sql`
    SELECT vendor_code
    FROM vendors
    WHERE vendor_code IS NOT NULL
      AND vendor_code <> ''
      AND vendor_code ~ ${`^${prefix}[0-9]+$`}
  `

  let maxNumeric = start
  for (const row of rows) {
    const code = String(row.vendor_code || "").trim()
    const numericPart = Number.parseInt(code.slice(prefix.length), 10)
    if (Number.isFinite(numericPart) && numericPart > maxNumeric) {
      maxNumeric = numericPart
    }
  }

  return `${prefix}${String(maxNumeric + 1)}`
}