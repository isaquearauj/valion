import { describe, expect, it } from "vitest"

import {
  calculateFinanceSummary,
  getCurrentInvestment,
  getExpenseDistribution,
  getInstallmentProgress,
  getMonthlyHistory,
  isExpenseCommitted,
  normalizeMonthlyIncome,
} from "@/features/finance/domain/calculations"
import { getCurrentMonthKey } from "@/features/finance/domain/initial-data"
import type {
  FinanceState,
  FixedExpense,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"

function state(overrides: Partial<FinanceState> = {}): FinanceState {
  return {
    expenses: [],
    goalContributions: [],
    goals: [],
    incomes: [],
    investments: [],
    reminders: [],
    snapshots: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function income(overrides: Partial<Income> = {}): Income {
  return {
    amount: 1000,
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency: "Mensal",
    id: "income-1",
    name: "Salário",
    notes: "",
    type: "Salário",
    ...overrides,
  }
}

function expense(overrides: Partial<FixedExpense> = {}): FixedExpense {
  return {
    category: "Contas fixas",
    createdAt: "2026-01-01T00:00:00.000Z",
    dueDay: 10,
    id: "expense-1",
    monthlyAmount: 500,
    name: "Aluguel",
    notes: "",
    remainingInstallments: 0,
    status: "Ativa",
    totalInstallments: 0,
    ...overrides,
  }
}

function investment(overrides: Partial<InvestmentEntry> = {}): InvestmentEntry {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "investment-1",
    investedAmount: 300,
    month: getCurrentMonthKey(),
    notes: "",
    plannedAmount: 250,
    ...overrides,
  }
}

describe("finance calculations", () => {
  it("normalizes income frequency to monthly values", () => {
    expect(normalizeMonthlyIncome(income({ amount: 100, frequency: "Mensal" }))).toBe(100)
    expect(normalizeMonthlyIncome(income({ amount: 100, frequency: "Quinzenal" }))).toBe(200)
    expect(normalizeMonthlyIncome(income({ amount: 100, frequency: "Semanal" }))).toBe(433)
    expect(normalizeMonthlyIncome(income({ amount: 100, frequency: "Única" }))).toBe(100)
  })

  it("only treats active expenses as committed", () => {
    expect(isExpenseCommitted(expense({ status: "Ativa" }))).toBe(true)
    expect(isExpenseCommitted(expense({ status: "Pausada" }))).toBe(false)
    expect(isExpenseCommitted(expense({ status: "Quitada" }))).toBe(false)
  })

  it("calculates a complete finance summary from active records", () => {
    const summary = calculateFinanceSummary(
      state({
        expenses: [
          expense({ id: "rent", monthlyAmount: 1200, remainingInstallments: 3 }),
          expense({ id: "paused", monthlyAmount: 999, status: "Pausada" }),
        ],
        incomes: [income({ amount: 5000 }), income({ amount: 500, frequency: "Quinzenal" })],
        investments: [investment({ investedAmount: 800, plannedAmount: 700 })],
      })
    )

    expect(summary).toEqual({
      activeExpensesCount: 1,
      budgetAvailable: 4800,
      budgetRemainingAfterInvestment: 4100,
      committedPercent: 20,
      debtInstallmentsRemaining: 3,
      fixedExpenses: 1200,
      investedAmount: 800,
      investmentDelta: 100,
      investmentInsight: "above",
      monthlyIncome: 6000,
      plannedInvestment: 700,
    })
  })

  it("keeps committed percent at zero when income is zero", () => {
    const summary = calculateFinanceSummary(state({ expenses: [expense({ monthlyAmount: 100 })] }))

    expect(summary.monthlyIncome).toBe(0)
    expect(summary.committedPercent).toBe(0)
    expect(Number.isNaN(summary.committedPercent)).toBe(false)
  })

  it("classifies investment insight by delta", () => {
    expect(
      calculateFinanceSummary(state({ investments: [investment({ investedAmount: 300, plannedAmount: 200 })] }))
        .investmentInsight
    ).toBe("above")
    expect(
      calculateFinanceSummary(state({ investments: [investment({ investedAmount: 100, plannedAmount: 200 })] }))
        .investmentInsight
    ).toBe("below")
    expect(
      calculateFinanceSummary(state({ investments: [investment({ investedAmount: 200, plannedAmount: 200 })] }))
        .investmentInsight
    ).toBe("on-track")
  })

  it("prefers the current investment and falls back to the latest month", () => {
    const current = investment({ id: "current", month: getCurrentMonthKey() })
    const latest = investment({ id: "latest", month: "2026-12" })
    const older = investment({ id: "older", month: "2025-01" })

    expect(getCurrentInvestment(state({ investments: [older, latest, current] }))).toBe(current)
    expect(getCurrentInvestment(state({ investments: [older, latest] }))).toBe(latest)
  })

  it("groups active expenses by category and sorts by amount", () => {
    expect(
      getExpenseDistribution(
        state({
          expenses: [
            expense({ category: "Assinaturas", id: "a", monthlyAmount: 50 }),
            expense({ category: "Contas fixas", id: "b", monthlyAmount: 700 }),
            expense({ category: "Assinaturas", id: "c", monthlyAmount: 60 }),
            expense({ category: "Outros", id: "d", monthlyAmount: 999, status: "Quitada" }),
          ],
        })
      )
    ).toEqual([
      { category: "Contas fixas", value: 700 },
      { category: "Assinaturas", value: 110 },
    ])
  })

  it("injects the current month snapshot and keeps history sorted", () => {
    const currentMonth = getCurrentMonthKey()

    expect(
      getMonthlyHistory(
        state({
          expenses: [expense({ monthlyAmount: 400 })],
          incomes: [income({ amount: 1000 })],
          investments: [investment({ investedAmount: 90, plannedAmount: 100 })],
          snapshots: [
            { expenses: 1, id: "current-old", income: 1, investedAmount: 1, month: currentMonth, plannedInvestment: 1 },
            { expenses: 700, id: "old", income: 2000, investedAmount: 100, month: "2025-12", plannedInvestment: 100 },
          ],
        })
      )
    ).toEqual([
      { expenses: 700, id: "old", income: 2000, investedAmount: 100, month: "2025-12", plannedInvestment: 100 },
      { expenses: 400, id: "snap-current", income: 1000, investedAmount: 90, month: currentMonth, plannedInvestment: 100 },
    ])
  })

  it("calculates installment progress with safe bounds", () => {
    expect(getInstallmentProgress(expense({ remainingInstallments: 0, totalInstallments: 0 }))).toBe(0)
    expect(getInstallmentProgress(expense({ remainingInstallments: 6, totalInstallments: 12 }))).toBe(50)
    expect(getInstallmentProgress(expense({ remainingInstallments: -2, totalInstallments: 10 }))).toBe(100)
    expect(getInstallmentProgress(expense({ remainingInstallments: 12, totalInstallments: 10 }))).toBe(0)
  })
})
