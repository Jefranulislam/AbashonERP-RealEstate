export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Cheque"
  | "Online"
  | "Online Transfer"
  | "Mobile Banking"

const UNITS = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
]

const TEENS = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

// Bangladeshi numbering scales: Crore = 1,00,00,000 and Lakh = 1,00,000
const SCALES = [
  { value: 10_000_000, label: "Crore" },
  { value: 100_000, label: "Lakh" },
  { value: 1_000, label: "Thousand" },
  { value: 100, label: "Hundred" },
]

function underOneHundredToWords(n: number): string {
  if (n >= 20) {
    const tens = TENS[Math.floor(n / 10)]
    const unit = n % 10
    return unit > 0 ? `${tens} ${UNITS[unit]}` : tens
  }
  if (n >= 10) return TEENS[n - 10]
  return UNITS[n]
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero"

  const parts: string[] = []
  let remaining = n

  for (const scale of SCALES) {
    if (remaining >= scale.value) {
      const chunk = Math.floor(remaining / scale.value)
      // Crore chunks can exceed 99 (e.g. 123 Crore) — recurse for those.
      const chunkWords = chunk > 99 ? integerToWords(chunk) : underOneHundredToWords(chunk)
      parts.push(`${chunkWords} ${scale.label}`)
      remaining %= scale.value
    }
  }

  if (remaining > 0) {
    parts.push(underOneHundredToWords(remaining))
  }

  return parts.join(" ").trim()
}

/**
 * Convert an amount into proper Bangladeshi financial wording.
 * e.g. 150000 -> "One Lakh Fifty Thousand Taka Only"
 */
export function amountToWordsBDT(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "Zero Taka Only"
  }

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)
  let taka = Math.floor(absAmount)
  let paisa = Math.round((absAmount - taka) * 100)

  if (paisa === 100) {
    taka += 1
    paisa = 0
  }

  const takaWords = integerToWords(taka)
  const prefix = isNegative ? "Minus " : ""

  if (paisa > 0) {
    const paisaWords = integerToWords(paisa)
    return `${prefix}${takaWords} Taka and ${paisaWords} Paisa Only`
  }

  return `${prefix}${takaWords} Taka Only`
}

export function normalizePaymentMethod(value?: string): PaymentMethod {
  if (!value) return "Cash"

  const normalized = value.trim().toLowerCase()

  if (normalized === "cash") return "Cash"
  if (normalized === "bank transfer") return "Bank Transfer"
  if (normalized === "cheque") return "Cheque"
  if (normalized === "online") return "Online"
  if (normalized === "online transfer") return "Online Transfer"
  if (normalized === "mobile banking") return "Mobile Banking"

  return "Cash"
}
