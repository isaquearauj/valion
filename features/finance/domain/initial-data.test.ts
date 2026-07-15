import { describe, expect, it } from "vitest"

import {
  createInitialFinanceState,
  getCurrentDateKey,
  getCurrentMonthKey,
} from "@/features/finance/domain/initial-data"

describe("initial finance date helpers", () => {
  it("formats date and month keys with zero-padded values", () => {
    const date = new Date(2026, 0, 8)

    expect(getCurrentDateKey(date)).toBe("2026-01-08")
    expect(getCurrentMonthKey(date)).toBe("2026-01")
  })

  it("creates an empty initial finance state", () => {
    const state = createInitialFinanceState()

    expect(state).toMatchObject({
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
    })
    expect(new Date(state.updatedAt).toString()).not.toBe("Invalid Date")
  })
})
