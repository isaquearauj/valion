import { describe, expect, it } from "vitest"
import { buildDemoData } from "./seed-local-data.mjs"

const userId = "11111111-1111-4111-8111-111111111111"

describe("seed financeiro local", () => {
  it("gera um cenário determinístico e variado para todas as telas", () => {
    const demo = buildDemoData(userId, "2026-09-26")

    expect(buildDemoData(userId, "2026-09-26")).toEqual(demo)
    expect(demo.snapshots.map((row) => row.month)).toEqual([
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
    ])
    expect(demo.incomes).toHaveLength(3)
    expect(demo.expenses).toHaveLength(12)
    expect(demo.investments).toHaveLength(6)
    expect(demo.goals).toHaveLength(3)
    expect(demo.contributions).toHaveLength(12)
    expect(demo.reminders).toHaveLength(3)

    const currentIncome = demo.incomes.reduce((sum, row) => sum + row.amount, 0)
    const currentExpenses = demo.expenses
      .filter((row) => row.status === "Ativa")
      .reduce((sum, row) => sum + row.monthly_amount, 0)
    expect(currentIncome).toBe(8100)
    expect(currentExpenses).toBe(5481)
    expect(currentIncome - currentExpenses - 1500).toBe(1119)
    expect(demo.expenses.filter((row) => row.category === "Consórcio")).toHaveLength(2)
    expect(
      demo.expenses
        .filter((row) => row.category === "Consórcio")
        .reduce((sum, row) => sum + row.monthly_amount, 0),
    ).toBe(1100)
    expect(new Set(demo.expenses.map((row) => row.category)).size).toBeGreaterThanOrEqual(4)
  })

  it("mantém chaves válidas, vínculos e regras de parcelamento", () => {
    const demo = buildDemoData(userId, "2026-09-26")
    const rows = [
      ...demo.snapshots,
      ...demo.incomes,
      ...demo.expenses,
      ...demo.investments,
      ...demo.goals,
      ...demo.contributions,
      ...demo.reminders,
    ]
    const ids = rows.map((row) => row.id)
    const goalIds = new Set(demo.goals.map((row) => row.id))

    expect(new Set(ids).size).toBe(ids.length)
    expect(
      ids.every((id) =>
        /^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(id),
      ),
    ).toBe(true)
    expect(rows.every((row) => row.user_id === userId)).toBe(true)
    expect(demo.contributions.every((row) => goalIds.has(row.goal_id))).toBe(true)
    expect(
      [...demo.expenses, ...demo.reminders].every(
        (row) => row.remaining_installments <= row.total_installments,
      ),
    ).toBe(true)
  })

  it("atravessa a virada de ano sem deslocar as datas", () => {
    const demo = buildDemoData(userId, "2026-01-03")

    expect(demo.currentMonth).toBe("2026-01-01")
    expect(demo.snapshots[0].month).toBe("2025-08-01")
    expect(demo.snapshots.at(-1).month).toBe("2025-12-01")
    expect(demo.reminders.find((row) => row.name === "Venda parcelada").next_due_date).toBe(
      "2026-01-01",
    )
    expect(demo.contributions.filter((row) => row.date === "2026-01-03")).toHaveLength(3)
  })
})
