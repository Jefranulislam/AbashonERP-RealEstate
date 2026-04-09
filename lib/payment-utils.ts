export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Cheque"
  | "Online"
  | "Online Transfer"
  | "Mobile Banking"

const UNITS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
]

const TEENS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
]

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

const SCALES = [
  { value: 1_000_000_000, label: "billion" },
  { value: 1_000_000, label: "million" },
  { value: 1_000, label: "thousand" },
]

function underOneThousandToWords(n: number): string {
  const parts: string[] = []

  if (n >= 100) {
    const hundreds = Math.floor(n / 100)
    parts.push(`${UNITS[hundreds]} hundred`)
    n %= 100
  }

  if (n >= 20) {
    const tens = Math.floor(n / 10)
    parts.push(TENS[tens])
    n %= 10
  } else if (n >= 10) {
    parts.push(TEENS[n - 10])
    n = 0
  }

  if (n > 0) {
    parts.push(UNITS[n])
  }

  return parts.join(" ").trim()
}

function integerToWords(n: number): string {
  if (n === 0) return "zero"

  const parts: string[] = []
  let remaining = n

  for (const scale of SCALES) {
    if (remaining >= scale.value) {
      const chunk = Math.floor(remaining / scale.value)
      parts.push(`${underOneThousandToWords(chunk)} ${scale.label}`)
      remaining %= scale.value
    }
  }

  if (remaining > 0) {
    parts.push(underOneThousandToWords(remaining))
  }

  return parts.join(" ").trim()
}

export function amountToWordsBDT(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "zero taka only"
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
  const prefix = isNegative ? "minus " : ""

  if (paisa > 0) {
    const paisaWords = integerToWords(paisa)
    return `${prefix}${takaWords} taka and ${paisaWords} paisa only`
  }

  return `${prefix}${takaWords} taka only`
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