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

type DbValue = string | number | null

export type IncomeRow = {
  id: string
  name: string
  type: Income["type"]
  amount: DbValue
  frequency: Income["frequency"]
  notes: string | null
  created_at: string
  updated_at?: string
}

export type ChargeReminderRow = {
  id: string
  name: string
  person: string
  type: ChargeReminder["type"]
  amount: DbValue
  frequency: ChargeReminder["frequency"]
  next_due_date: string
  total_installments: number | null
  remaining_installments: number | null
  status: ChargeReminder["status"]
  notes: string | null
  created_at: string
  updated_at?: string
}

export type FixedExpenseRow = {
  id: string
  name: string
  category: FixedExpense["category"]
  monthly_amount: DbValue
  due_day: number
  total_installments: number | null
  remaining_installments: number | null
  status: FixedExpense["status"]
  notes: string | null
  created_at: string
  updated_at?: string
}

export type GoalRow = {
  id: string
  name: string
  target_amount: DbValue
  target_date: string | null
  status: Goal["status"]
  notes: string | null
  created_at: string
  updated_at?: string
}

export type GoalContributionRow = {
  id: string
  goal_id: string
  amount: DbValue
  date: string
  notes: string | null
  created_at: string
  updated_at?: string
}

export type InvestmentEntryRow = {
  id: string
  month: string
  planned_amount: DbValue
  invested_amount: DbValue
  notes: string | null
  created_at: string
  updated_at?: string
}

export type MonthlySnapshotRow = {
  id: string
  month: string
  income: DbValue
  expenses: DbValue
  planned_investment: DbValue
  invested_amount: DbValue
  updated_at?: string
}

function toNumber(value: DbValue) {
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
    frequency: row.frequency,
    id: row.id,
    name: row.name,
    notes: row.notes ?? "",
    type: row.type,
  }
}

export function mapChargeReminder(row: ChargeReminderRow): ChargeReminder {
  return {
    amount: toNumber(row.amount),
    createdAt: row.created_at,
    frequency: row.frequency,
    id: row.id,
    name: row.name,
    nextDueDate: row.next_due_date,
    notes: row.notes ?? "",
    person: row.person,
    remainingInstallments: row.remaining_installments ?? 0,
    status: row.status,
    totalInstallments: row.total_installments ?? 0,
    type: row.type,
  }
}

export function mapFixedExpense(row: FixedExpenseRow): FixedExpense {
  return {
    category: row.category,
    createdAt: row.created_at,
    dueDay: row.due_day,
    id: row.id,
    monthlyAmount: toNumber(row.monthly_amount),
    name: row.name,
    notes: row.notes ?? "",
    remainingInstallments: row.remaining_installments ?? 0,
    status: row.status,
    totalInstallments: row.total_installments ?? 0,
  }
}

export function mapGoal(row: GoalRow): Goal {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    notes: row.notes ?? "",
    status: row.status,
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
    notes: row.notes ?? "",
  }
}

export function mapInvestmentEntry(row: InvestmentEntryRow): InvestmentEntry {
  return {
    createdAt: row.created_at,
    id: row.id,
    investedAmount: toNumber(row.invested_amount),
    month: toMonthKey(row.month),
    notes: row.notes ?? "",
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

export function getWorkspaceUpdatedAt(rows: Array<{ updated_at?: string }[]>) {
  const timestamps = rows.flatMap((items) => items.map((item) => item.updated_at).filter(Boolean))

  return timestamps.toSorted().at(-1) ?? new Date().toISOString()
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
    updatedAt: new Date().toISOString(),
  }
}
