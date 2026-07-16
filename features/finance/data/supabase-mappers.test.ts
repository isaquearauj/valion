import { describe, expect, it, vi } from "vitest"

import {
  type ChargeReminderRow,
  createEmptyFinanceState,
  type FixedExpenseRow,
  type GoalContributionRow,
  type GoalRow,
  getWorkspaceUpdatedAt,
  type IncomeRow,
  type InvestmentEntryRow,
  type MonthlySnapshotRow,
  mapChargeReminder,
  mapFixedExpense,
  mapGoal,
  mapGoalContribution,
  mapIncome,
  mapInvestmentEntry,
  mapMonthlySnapshot,
  monthKeyToDate,
} from "@/features/finance/data/supabase-mappers"

describe("Supabase finance mappers", () => {
  it("maps income rows and normalizes nullable values", () => {
    const row: IncomeRow = {
      amount: "1234.56",
      created_at: "2026-01-01T00:00:00.000Z",
      frequency: "Mensal",
      id: "income-1",
      name: "Salário",
      notes: null,
      type: "Salário",
    }

    expect(mapIncome(row)).toEqual({
      amount: 1234.56,
      createdAt: row.created_at,
      frequency: "Mensal",
      id: "income-1",
      name: "Salário",
      notes: "",
      type: "Salário",
    })
  })

  it("maps reminder rows with null installment defaults", () => {
    const row: ChargeReminderRow = {
      amount: 200,
      created_at: "2026-01-01T00:00:00.000Z",
      frequency: "Quinzenal",
      id: "reminder-1",
      name: "Cobrança",
      next_due_date: "2026-01-15",
      notes: null,
      person: "Ana",
      remaining_installments: null,
      status: "Ativo",
      total_installments: null,
      type: "Recorrente",
    }

    expect(mapChargeReminder(row)).toMatchObject({
      amount: 200,
      nextDueDate: "2026-01-15",
      notes: "",
      remainingInstallments: 0,
      totalInstallments: 0,
    })
  })

  it("maps fixed expense rows", () => {
    const row: FixedExpenseRow = {
      category: "Assinaturas",
      created_at: "2026-01-01T00:00:00.000Z",
      due_day: 5,
      id: "expense-1",
      monthly_amount: null,
      name: "Streaming",
      notes: null,
      remaining_installments: null,
      status: "Ativa",
      total_installments: null,
    }

    expect(mapFixedExpense(row)).toEqual({
      category: "Assinaturas",
      createdAt: row.created_at,
      dueDay: 5,
      id: "expense-1",
      monthlyAmount: 0,
      name: "Streaming",
      notes: "",
      remainingInstallments: 0,
      status: "Ativa",
      totalInstallments: 0,
    })
  })

  it("maps goals and contributions", () => {
    const goalRow: GoalRow = {
      created_at: "2026-01-01T00:00:00.000Z",
      id: "goal-1",
      name: "Reserva",
      notes: null,
      status: "Ativa",
      target_amount: "10000",
      target_date: null,
    }
    const contributionRow: GoalContributionRow = {
      amount: "500.25",
      created_at: "2026-01-02T00:00:00.000Z",
      date: "2026-01-02",
      goal_id: "goal-1",
      id: "contribution-1",
      notes: null,
    }

    expect(mapGoal(goalRow)).toMatchObject({ notes: "", targetAmount: 10000, targetDate: null })
    expect(mapGoalContribution(contributionRow)).toMatchObject({
      amount: 500.25,
      goalId: "goal-1",
      notes: "",
    })
  })

  it("maps month-based rows to month keys", () => {
    const investmentRow: InvestmentEntryRow = {
      created_at: "2026-01-01T00:00:00.000Z",
      id: "investment-1",
      invested_amount: "150",
      month: "2026-03-01",
      notes: null,
      planned_amount: 200,
    }
    const snapshotRow: MonthlySnapshotRow = {
      expenses: "800",
      id: "snapshot-1",
      income: null,
      invested_amount: 150,
      month: "2026-03-01",
      planned_investment: "200",
    }

    expect(mapInvestmentEntry(investmentRow)).toMatchObject({
      investedAmount: 150,
      month: "2026-03",
      plannedAmount: 200,
    })
    expect(mapMonthlySnapshot(snapshotRow)).toEqual({
      expenses: 800,
      id: "snapshot-1",
      income: 0,
      investedAmount: 150,
      month: "2026-03",
      plannedInvestment: 200,
    })
    expect(monthKeyToDate("2026-03")).toBe("2026-03-01")
  })

  it("returns the latest workspace update timestamp", () => {
    expect(
      getWorkspaceUpdatedAt([
        [{ updated_at: "2026-01-02T00:00:00.000Z" }],
        [{ updated_at: "2026-01-03T00:00:00.000Z" }, {}],
      ]),
    ).toBe("2026-01-03T00:00:00.000Z")
  })

  it("falls back to current time when rows have no timestamps", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-05T06:07:08.000Z"))

    expect(getWorkspaceUpdatedAt([[], [{}]])).toBe("2026-04-05T06:07:08.000Z")

    vi.useRealTimers()
  })

  it("creates an empty finance state", () => {
    const emptyState = createEmptyFinanceState()

    expect(emptyState).toMatchObject({
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
    })
    expect(new Date(emptyState.updatedAt).toString()).not.toBe("Invalid Date")
  })
})
