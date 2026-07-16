import { describe, expect, it } from "vitest"
import {
  createEmptyFinanceState,
  mapChargeReminder,
  mapFixedExpense,
  mapGoal,
  mapGoalContribution,
  mapIncome,
  mapInvestmentEntry,
  mapMonthlySnapshot,
  monthKeyToDate,
} from "@/features/finance/data/supabase-mappers"

const timestamps = {
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  user_id: "user-1",
}

describe("Supabase finance mappers", () => {
  it("maps official income rows including received_on", () => {
    expect(
      mapIncome({
        ...timestamps,
        amount: 1234.56,
        frequency: "Única",
        id: "income-1",
        name: "Bônus",
        notes: "",
        received_on: "2026-01-15",
        type: "Renda extra",
      }),
    ).toMatchObject({ amount: 1234.56, id: "income-1", receivedOn: "2026-01-15" })
  })

  it("maps reminders and fixed expenses", () => {
    expect(
      mapChargeReminder({
        ...timestamps,
        amount: 200,
        frequency: "Quinzenal",
        id: "reminder-1",
        name: "Cobrança",
        next_due_date: "2026-01-15",
        notes: "",
        person: "Ana",
        remaining_installments: 0,
        status: "Ativo",
        total_installments: 0,
        type: "Recorrente",
      }),
    ).toMatchObject({ nextDueDate: "2026-01-15", remainingInstallments: 0 })
    expect(
      mapFixedExpense({
        ...timestamps,
        category: "Assinaturas",
        due_day: 5,
        id: "expense-1",
        monthly_amount: 99,
        name: "Streaming",
        notes: "",
        remaining_installments: 0,
        status: "Ativa",
        total_installments: 0,
      }),
    ).toMatchObject({ dueDay: 5, monthlyAmount: 99 })
  })

  it("maps goals and contributions", () => {
    expect(
      mapGoal({
        ...timestamps,
        id: "goal-1",
        name: "Reserva",
        notes: "",
        status: "Ativa",
        target_amount: 10000,
        target_date: null,
      }),
    ).toMatchObject({ targetAmount: 10000 })
    expect(
      mapGoalContribution({
        ...timestamps,
        amount: 500.25,
        date: "2026-01-02",
        goal_id: "goal-1",
        id: "contribution-1",
        notes: "",
      }),
    ).toMatchObject({ amount: 500.25, goalId: "goal-1" })
  })

  it("maps month rows and creates an empty state without metadata", () => {
    expect(
      mapInvestmentEntry({
        ...timestamps,
        id: "investment-1",
        invested_amount: 150,
        month: "2026-03-01",
        notes: "",
        planned_amount: 200,
      }),
    ).toMatchObject({ month: "2026-03", plannedAmount: 200 })
    expect(
      mapMonthlySnapshot({
        ...timestamps,
        expenses: 800,
        id: "snapshot-1",
        income: 1000,
        invested_amount: 150,
        month: "2026-03-01",
        planned_investment: 200,
      }),
    ).toMatchObject({ month: "2026-03", income: 1000 })
    expect(monthKeyToDate("2026-03")).toBe("2026-03-01")
    expect(createEmptyFinanceState()).toEqual({
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
    })
  })
})
