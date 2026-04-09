import { describe, expect, it } from "vitest"
import { formatDateDMY } from "../../lib/utils"

describe("formatDateDMY", () => {
  it("formats a valid ISO date", () => {
    expect(formatDateDMY("2026-04-05")).toBe("05-04-2026")
  })

  it("returns dash for invalid date", () => {
    expect(formatDateDMY("not-a-date")).toBe("-")
  })

  it("returns dash for nullish values", () => {
    expect(formatDateDMY(undefined)).toBe("-")
    expect(formatDateDMY(null)).toBe("-")
  })
})
