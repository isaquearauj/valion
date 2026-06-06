import { getCurrentMonthKey } from "@/features/finance/initial-data"
import type {
  FinanceState,
  FinanceSummary,
  FixedExpense,
  Income,
  IncomeFrequency,
  MonthlySnapshot,
} from "@/features/finance/types"

const frequencyMultiplier: Record<IncomeFrequency, number> = {
  Mensal: 1,
  Quinzenal: 2,
  Semanal: 4.33,
  Única: 1,
}

export function normalizeMonthlyIncome(income: Income) {
  return income.amount * frequencyMultiplier[income.frequency]
}

export function isExpenseCommitted(expense: FixedExpense) {
  return expense.status === "Ativa"
}

export function calculateFinanceSummary(state: FinanceState): FinanceSummary {
  const monthlyIncome = state.incomes.reduce(
    (total, income) => total + normalizeMonthlyIncome(income),
    0
  )
  const activeExpenses = state.expenses.filter(isExpenseCommitted)
  const fixedExpenses = activeExpenses.reduce(
    (total, expense) => total + expense.monthlyAmount,
    0
  )
  const currentInvestment = getCurrentInvestment(state)
  const plannedInvestment = currentInvestment?.plannedAmount ?? 0
  const investedAmount = currentInvestment?.investedAmount ?? 0
  const budgetAvailable = monthlyIncome - fixedExpenses
  const budgetRemainingAfterInvestment = budgetAvailable - plannedInvestment
  const committedPercent = monthlyIncome > 0 ? (fixedExpenses / monthlyIncome) * 100 : 0
  const investmentDelta = investedAmount - plannedInvestment
  const investmentInsight =
    investmentDelta > 0 ? "above" : investmentDelta < 0 ? "below" : "on-track"
  const debtInstallmentsRemaining = activeExpenses.reduce(
    (total, expense) => total + expense.remainingInstallments,
    0
  )

  return {
    activeExpensesCount: activeExpenses.length,
    committedPercent,
    debtInstallmentsRemaining,
    budgetAvailable,
    fixedExpenses,
    investedAmount,
    investmentDelta,
    investmentInsight,
    monthlyIncome,
    plannedInvestment,
    budgetRemainingAfterInvestment,
  }
}

export function getCurrentInvestment(state: FinanceState) {
  const currentMonth = getCurrentMonthKey()

  return (
    state.investments.find((investment) => investment.month === currentMonth) ??
    state.investments.toSorted((a, b) => b.month.localeCompare(a.month))[0]
  )
}

export function getExpenseDistribution(state: FinanceState) {
  const totals = new Map<string, number>()

  for (const expense of state.expenses) {
    if (!isExpenseCommitted(expense)) {
      continue
    }

    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.monthlyAmount)
  }

  return Array.from(totals, ([category, value]) => ({ category, value })).toSorted(
    (a, b) => b.value - a.value
  )
}

export function getMonthlyHistory(state: FinanceState): MonthlySnapshot[] {
  const summary = calculateFinanceSummary(state)
  const currentMonth = getCurrentMonthKey()
  const currentSnapshot: MonthlySnapshot = {
    expenses: summary.fixedExpenses,
    id: "snap-current",
    income: summary.monthlyIncome,
    investedAmount: summary.investedAmount,
    month: currentMonth,
    plannedInvestment: summary.plannedInvestment,
  }

  const previousSnapshots = state.snapshots.filter(
    (snapshot) => snapshot.month !== currentMonth
  )

  return [...previousSnapshots, currentSnapshot].toSorted((a, b) =>
    a.month.localeCompare(b.month)
  )
}

export function getInstallmentProgress(expense: FixedExpense) {
  if (expense.totalInstallments <= 0) {
    return 0
  }

  const paid = Math.max(expense.totalInstallments - expense.remainingInstallments, 0)
  return Math.min((paid / expense.totalInstallments) * 100, 100)
}
