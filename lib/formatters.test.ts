import { describe, expect, it } from "vitest"

import {
  formatCurrency,
  formatDate,
  formatDateKey,
  formatDateKeyLong,
  formatDueDay,
  formatMonth,
  formatMonthChip,
  formatPercent,
} from "@/lib/formatters"

function normalizeSpaces(value: string) {
  return value.replace(/\s/g, " ")
}

describe("formatters", () => {
  it("formats BRL currency", () => {
    expect(normalizeSpaces(formatCurrency(1234.5))).toBe("R$ 1.234,50")
  })

  it("formats numbers as percentages from a 0-100 scale", () => {
    expect(formatPercent(12.34)).toBe("12,3%")
    expect(formatPercent(100)).toBe("100%")
  })

  it("formats month keys in pt-BR", () => {
    expect(formatMonth("2026-01")).toBe("janeiro de 2026")
    expect(formatMonthChip("2026-01")).toBe("jan/26")
  })

  it("formats ISO dates and date keys in pt-BR", () => {
    expect(formatDate("2026-01-08T12:00:00.000Z")).toContain("2026")
    expect(formatDateKey("2026-01-08")).toContain("2026")
    expect(formatDateKeyLong("2026-01-08")).toContain("janeiro")
  })

  it("formats due days with zero padding", () => {
    expect(formatDueDay(5)).toBe("Todo dia 05")
    expect(formatDueDay(15)).toBe("Todo dia 15")
  })
})
