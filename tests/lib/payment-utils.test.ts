import { describe, expect, it } from "vitest"
import { amountToWordsBDT, normalizePaymentMethod } from "../../lib/payment-utils"

describe("amountToWordsBDT", () => {
  it("uses Bangladeshi lakh/crore scales with proper capitalization", () => {
    expect(amountToWordsBDT(150000)).toBe("One Lakh Fifty Thousand Taka Only")
    expect(amountToWordsBDT(12345)).toBe("Twelve Thousand Three Hundred Forty Five Taka Only")
    expect(amountToWordsBDT(10000000)).toBe("One Crore Taka Only")
    expect(amountToWordsBDT(12534090)).toBe(
      "One Crore Twenty Five Lakh Thirty Four Thousand Ninety Taka Only"
    )
  })

  it("includes paisa when decimals are present", () => {
    expect(amountToWordsBDT(1200.5)).toBe("One Thousand Two Hundred Taka and Fifty Paisa Only")
  })

  it("handles zero and invalid numbers safely", () => {
    expect(amountToWordsBDT(0)).toBe("Zero Taka Only")
    expect(amountToWordsBDT(Number.NaN)).toBe("Zero Taka Only")
  })

  it("never emits approximations or numerals", () => {
    const words = amountToWordsBDT(987654321)
    expect(words.toLowerCase()).not.toContain("approximately")
    expect(words).not.toMatch(/\d/)
  })
})

describe("normalizePaymentMethod", () => {
  it("preserves supported explicit payment methods", () => {
    expect(normalizePaymentMethod("Bank Transfer")).toBe("Bank Transfer")
    expect(normalizePaymentMethod("Online Transfer")).toBe("Online Transfer")
    expect(normalizePaymentMethod("Mobile Banking")).toBe("Mobile Banking")
    expect(normalizePaymentMethod("Online")).toBe("Online")
  })

  it("is case-insensitive and defaults unknown methods to Cash", () => {
    expect(normalizePaymentMethod("mobile banking")).toBe("Mobile Banking")
    expect(normalizePaymentMethod("WIRE")).toBe("Cash")
    expect(normalizePaymentMethod(undefined)).toBe("Cash")
  })
})
