export type VoucherType = "Credit" | "Debit" | "Journal" | "Contra"

const VOUCHER_TYPE_ALIASES: Record<string, VoucherType> = {
  credit: "Credit",
  cr: "Credit",
  debit: "Debit",
  dr: "Debit",
  dv: "Debit",
  journal: "Journal",
  jr: "Journal",
  jv: "Journal",
  contra: "Contra",
  cv: "Contra",
}

export function normalizeVoucherType(voucherType: string): VoucherType | null {
  const raw = String(voucherType ?? "").trim().toLowerCase()
  return VOUCHER_TYPE_ALIASES[raw] ?? null
}

export function getVoucherPrefix(voucherType: string): string {
  const normalized = normalizeVoucherType(voucherType) ?? voucherType

  switch (normalized) {
    case "Credit":
      return "CR"
    case "Debit":
      return "DV"
    case "Journal":
      return "JV"
    case "Contra":
      return "CV"
    default:
      return "VX"
  }
}

export function buildVoucherNo(voucherType: string, serial: number, year = new Date().getFullYear()): string {
  const prefix = getVoucherPrefix(voucherType)
  return `${prefix}-${year}-${String(serial).padStart(4, "0")}`
}
