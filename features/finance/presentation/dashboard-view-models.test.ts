import { describe, expect, it, vi } from "vitest"
import type {
  ChargeReminder,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"
import {
  addMonthsToMonthKey,
  calculateGoalsSummary,
  formatGoalChartLabel,
  formatGoalDeadline,
  formatShortCurrency,
  getAdjacentMonthKeys,
  getBudgetCommitmentStatus,
  getExpenseDefaults,
  getGoalContributionDefaults,
  getGoalDefaults,
  getGoalProgress,
  getGoalStatusPriority,
  getGoalTimeline,
  getIncomeDefaults,
  getInitials,
  getInvestmentDefaults,
  getReminderDefaults,
  getReminderProgress,
  getReminderStatusPriority,
  isGoalCompleted,
  isReminderDue,
  normalizeGoalFormValues,
  normalizeReminderFormValues,
  sortGoals,
} from "@/features/finance/presentation/dashboard-view-models"

function reminder(overrides: Partial<ChargeReminder> = {}): ChargeReminder {
  return {
    amount: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency: "Mensal",
    id: "reminder-1",
    name: "Cobrança",
    nextDueDate: "2026-01-10",
    notes: "",
    person: "Ana",
    remainingInstallments: 2,
    status: "Ativo",
    totalInstallments: 4,
    type: "Parcelado",
    ...overrides,
  }
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "goal-1",
    name: "Reserva",
    notes: "",
    status: "Ativa",
    targetAmount: 1000,
    targetDate: "2026-12-31",
    ...overrides,
  }
}

function contribution(overrides: Partial<GoalContribution> = {}): GoalContribution {
  return {
    amount: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    date: "2026-01-01",
    goalId: "goal-1",
    id: "contribution-1",
    notes: "",
    ...overrides,
  }
}

describe("dashboard view models", () => {
  it("classifies budget commitment at expected thresholds", () => {
    expect(getBudgetCommitmentStatus(40).label).toBe("Confortável")
    expect(getBudgetCommitmentStatus(40.1).label).toBe("Saudável")
    expect(getBudgetCommitmentStatus(55.1).label).toBe("Atenção")
    expect(getBudgetCommitmentStatus(70.1).label).toBe("Crítico")
  })

  it("detects due reminders only for active reminders", () => {
    expect(
      isReminderDue(reminder({ nextDueDate: "2026-01-10", status: "Ativo" }), "2026-01-10"),
    ).toBe(true)
    expect(
      isReminderDue(reminder({ nextDueDate: "2026-01-11", status: "Ativo" }), "2026-01-10"),
    ).toBe(false)
    expect(
      isReminderDue(reminder({ nextDueDate: "2026-01-01", status: "Pausado" }), "2026-01-10"),
    ).toBe(false)
  })

  it("calculates reminder progress and status priority", () => {
    expect(getReminderProgress(reminder({ totalInstallments: 0 }))).toBe(0)
    expect(getReminderProgress(reminder({ remainingInstallments: 2, totalInstallments: 4 }))).toBe(
      50,
    )
    expect(getReminderProgress(reminder({ remainingInstallments: -1, totalInstallments: 4 }))).toBe(
      100,
    )
    expect(getReminderStatusPriority(reminder({ status: "Ativo" }))).toBe(0)
    expect(getReminderStatusPriority(reminder({ status: "Pausado" }))).toBe(1)
    expect(getReminderStatusPriority(reminder({ status: "Concluído" }))).toBe(2)
  })

  it("normalizes reminder form values", () => {
    expect(
      normalizeReminderFormValues({
        amount: 100,
        frequency: "Mensal",
        name: "Recorrente",
        nextDueDate: "2026-01-10",
        notes: "",
        person: "Ana",
        remainingInstallments: 5,
        status: "Ativo",
        totalInstallments: 10,
        type: "Recorrente",
      }),
    ).toMatchObject({ remainingInstallments: 0, totalInstallments: 0 })
    expect(
      normalizeReminderFormValues({
        amount: 100,
        frequency: "Mensal",
        name: "Parcelado",
        nextDueDate: "2026-01-10",
        notes: "",
        person: "Ana",
        remainingInstallments: 0,
        status: "Ativo",
        totalInstallments: 10,
        type: "Parcelado",
      }).status,
    ).toBe("Concluído")
  })

  it("handles month key navigation across years", () => {
    expect(addMonthsToMonthKey("2026-01", -1)).toBe("2025-12")
    expect(addMonthsToMonthKey("2026-12", 1)).toBe("2027-01")
    expect(getAdjacentMonthKeys("2026-01")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
    ])
  })

  it("builds defaults for new and existing records", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 8))

    const income: Income = {
      amount: 500,
      createdAt: "2026-01-01T00:00:00.000Z",
      frequency: "Semanal",
      id: "income-1",
      name: "Freela",
      notes: "obs",
      receivedOn: null,
      type: "Freelance",
    }
    const expense: FixedExpense = {
      category: "Assinaturas",
      createdAt: "2026-01-01T00:00:00.000Z",
      dueDay: 12,
      id: "expense-1",
      monthlyAmount: 90,
      name: "App",
      notes: "obs",
      remainingInstallments: 0,
      status: "Ativa",
      totalInstallments: 0,
    }
    const investment: InvestmentEntry = {
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "investment-1",
      investedAmount: 100,
      month: "2026-02",
      notes: "obs",
      plannedAmount: 200,
    }

    expect(getIncomeDefaults(income)).toMatchObject({
      amount: 500,
      frequency: "Semanal",
      type: "Freelance",
    })
    expect(getIncomeDefaults(null)).toMatchObject({
      amount: "",
      frequency: "Mensal",
      type: "Salário",
    })
    expect(getReminderDefaults(null)).toMatchObject({
      nextDueDate: "2026-01-08",
      status: "Ativo",
      type: "Recorrente",
    })
    expect(getExpenseDefaults(expense)).toMatchObject({
      category: "Assinaturas",
      dueDay: 12,
      monthlyAmount: 90,
    })
    expect(getInvestmentDefaults(investment)).toMatchObject({
      investedAmount: 100,
      month: "2026-02",
      plannedAmount: 200,
    })
    expect(getInvestmentDefaults(null).month).toBe("2026-01")
    expect(getGoalDefaults(goal({ targetDate: null }))).toMatchObject({
      deadlineDate: "",
      deadlineEnabled: false,
    })
    expect(getGoalContributionDefaults("", [goal({ id: "goal-a" })])).toMatchObject({
      date: "2026-01-08",
      goalId: "goal-a",
    })

    vi.useRealTimers()
  })

  it("summarizes goals and caps progress at 100%", () => {
    const goals = [goal({ id: "g1", targetAmount: 1000 }), goal({ id: "g2", targetAmount: 500 })]
    const contributions = [
      contribution({ amount: 1200, goalId: "g1" }),
      contribution({ amount: 100, goalId: "g2" }),
    ]

    expect(
      getGoalProgress(
        goals[0],
        contributions.filter((item) => item.goalId === "g1"),
      ),
    ).toEqual({
      currentAmount: 1200,
      percent: 100,
      remainingAmount: 0,
    })
    expect(
      isGoalCompleted(
        goals[0],
        contributions.filter((item) => item.goalId === "g1"),
      ),
    ).toBe(true)
    expect(calculateGoalsSummary(goals, contributions)).toEqual({
      activeGoals: 1,
      completedGoals: 1,
      completionRate: (1300 / 1500) * 100,
      totalContributed: 1300,
      totalTarget: 1500,
    })
  })

  it("builds goal timelines in chronological order", () => {
    expect(
      getGoalTimeline(goal({ targetAmount: 1000 }), [
        contribution({
          amount: 200,
          createdAt: "2026-01-02T00:00:00.000Z",
          date: "2026-01-02",
          id: "c2",
        }),
        contribution({
          amount: 100,
          createdAt: "2026-01-01T00:00:00.000Z",
          date: "2026-01-02",
          id: "c1",
        }),
        contribution({
          amount: 50,
          createdAt: "2026-01-01T00:00:00.000Z",
          date: "2026-01-01",
          id: "c0",
        }),
      ]),
    ).toMatchObject([
      { cumulativeAmount: 50, date: "2026-01-01", targetAmount: 1000 },
      { cumulativeAmount: 150, date: "2026-01-02", targetAmount: 1000 },
      { cumulativeAmount: 350, date: "2026-01-02", targetAmount: 1000 },
    ])
  })

  it("sorts goals by completion, status, deadline and creation date", () => {
    const activeWithoutOwnContribution = goal({
      createdAt: "2026-01-02T00:00:00.000Z",
      id: "active",
      targetDate: "2026-03-01",
    })
    const paused = goal({ id: "paused", status: "Pausada", targetDate: "2026-02-01" })
    const completed = goal({ id: "completed", targetAmount: 100, targetDate: "2026-01-01" })
    const newerNoDeadline = goal({
      createdAt: "2026-01-03T00:00:00.000Z",
      id: "newer",
      targetDate: null,
    })
    const newerSameDeadline = goal({
      createdAt: "2026-01-04T00:00:00.000Z",
      id: "newer-same",
      targetDate: "2026-03-01",
    })

    expect(
      sortGoals(
        [completed, paused, newerNoDeadline, activeWithoutOwnContribution, newerSameDeadline],
        [contribution({ amount: 100, goalId: "completed" })],
      ).map((item) => item.id),
    ).toEqual(["newer-same", "active", "newer", "paused", "completed"])
  })

  it("normalizes goal form values with completion and deadline rules", () => {
    expect(
      normalizeGoalFormValues(
        {
          deadlineDate: "",
          deadlineEnabled: false,
          name: "Reserva",
          notes: "",
          status: "Ativa",
          targetAmount: 1000,
        },
        1000,
      ),
    ).toMatchObject({ status: "Concluída", targetDate: null })
    expect(
      normalizeGoalFormValues(
        {
          deadlineDate: "2026-12-31",
          deadlineEnabled: true,
          name: "Reserva",
          notes: "",
          status: "Pausada",
          targetAmount: 1000,
        },
        100,
      ),
    ).toMatchObject({ status: "Pausada", targetDate: "2026-12-31" })
  })

  it("formats labels, initials and compact currency", () => {
    expect(formatGoalDeadline(goal({ targetDate: null }))).toBe("Sem prazo")
    expect(formatGoalDeadline(goal({ targetDate: "2026-01-08" }))).toContain("2026")
    expect(formatGoalChartLabel("2026-01-08")).toContain("08")
    expect(getGoalStatusPriority(goal({ status: "Ativa" }))).toBe(0)
    expect(getGoalStatusPriority(goal({ status: "Pausada" }))).toBe(1)
    expect(getGoalStatusPriority(goal({ status: "Concluída" }))).toBe(2)
    expect(getInitials(" Ana   Maria Silva ")).toBe("AM")
    expect(formatShortCurrency(1500)).toBe("R$ 2 mil")
    expect(formatShortCurrency(-1500)).toBe("R$ -1 mil")
    expect(formatShortCurrency(50)).toContain("50")
  })
})
