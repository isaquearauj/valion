import type {
  ChargeReminder,
  FinanceState,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
  MonthlySnapshot,
} from "@/features/finance/domain/types"
import type { Tables } from "@/lib/supabase/database.types"

export type IncomeRow = Tables<"incomes">
export type ChargeReminderRow = Tables<"charge_reminders">
export type FixedExpenseRow = Tables<"fixed_expenses">
export type GoalRow = Tables<"financial_goals">
export type GoalContributionRow = Tables<"goal_contributions">
export type InvestmentEntryRow = Tables<"investment_entries">
export type MonthlySnapshotRow = Tables<"monthly_snapshots">

function toNumber(value: number | string | null) {
  return Number(value ?? 0)
}

function toMonthKey(value: string) {
  return value.slice(0, 7)
}

export function monthKeyToDate(monthKey: string) {
  return `${monthKey}-01`
}

export function mapIncome(row: IncomeRow): Income {
  return {
    amount: toNumber(row.amount),
    createdAt: row.created_at,
    frequency: row.frequency as Income["frequency"],
    id: row.id,
    name: row.name,
    notes: row.notes,
    receivedOn: row.received_on,
    type: row.type as Income["type"],
  }
}

export function mapChargeReminder(row: ChargeReminderRow): ChargeReminder {
  return {
    amount: toNumber(row.amount),
    createdAt: row.created_at,
    frequency: row.frequency as ChargeReminder["frequency"],
    id: row.id,
    name: row.name,
    nextDueDate: row.next_due_date,
    notes: row.notes,
    person: row.person,
    remainingInstallments: row.remaining_installments,
    status: row.status as ChargeReminder["status"],
    totalInstallments: row.total_installments,
    type: row.type as ChargeReminder["type"],
  }
}

export function mapFixedExpense(row: FixedExpenseRow): FixedExpense {
  return {
    category: row.category as FixedExpense["category"],
    createdAt: row.created_at,
    dueDay: row.due_day,
    id: row.id,
    monthlyAmount: toNumber(row.monthly_amount),
    name: row.name,
    notes: row.notes,
    remainingInstallments: row.remaining_installments,
    status: row.status as FixedExpense["status"],
    totalInstallments: row.total_installments,
  }
}

export function mapGoal(row: GoalRow): Goal {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    notes: row.notes,
    status: row.status as Goal["status"],
    targetAmount: toNumber(row.target_amount),
    targetDate: row.target_date,
  }
}

export function mapGoalContribution(row: GoalContributionRow): GoalContribution {
  return {
    amount: toNumber(row.amount),
    createdAt: row.created_at,
    date: row.date,
    goalId: row.goal_id,
    id: row.id,
    notes: row.notes,
  }
}

export function mapInvestmentEntry(row: InvestmentEntryRow): InvestmentEntry {
  return {
    createdAt: row.created_at,
    id: row.id,
    investedAmount: toNumber(row.invested_amount),
    month: toMonthKey(row.month),
    notes: row.notes,
    plannedAmount: toNumber(row.planned_amount),
  }
}

export function mapMonthlySnapshot(row: MonthlySnapshotRow): MonthlySnapshot {
  return {
    expenses: toNumber(row.expenses),
    id: row.id,
    income: toNumber(row.income),
    investedAmount: toNumber(row.invested_amount),
    month: toMonthKey(row.month),
    plannedInvestment: toNumber(row.planned_investment),
  }
}

export function createEmptyFinanceState(): FinanceState {
  return {
    expenses: [],
    goalContributions: [],
    goals: [],
    incomes: [],
    investments: [],
    reminders: [],
    snapshots: [],
  }
}
