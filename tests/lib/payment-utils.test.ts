import { describe, expect, it } from "vitest"
import { amountToWordsBDT, normalizePaymentMethod } from "../../lib/payment-utils"

describe("amountToWordsBDT", () => {
  it("returns exact words for whole amounts", () => {
    expect(amountToWordsBDT(12345)).toBe("twelve thousand three hundred forty five taka only")
  })

  it("includes paisa when decimals are present", () => {
    expect(amountToWordsBDT(1200.5)).toBe("one thousand two hundred taka and fifty paisa only")
  })

  it("handles zero and invalid numbers safely", () => {
    expect(amountToWordsBDT(0)).toBe("zero taka only")
    expect(amountToWordsBDT(Number.NaN)).toBe("zero taka only")
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
