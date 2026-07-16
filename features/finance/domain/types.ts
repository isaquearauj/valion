export const EXPENSE_CATEGORIES = [
  "Contas fixas",
  "Assinaturas",
  "Parcelamentos",
  "Empréstimos",
  "Financiamentos",
  "Outros",
] as const

export const EXPENSE_STATUSES = ["Ativa", "Pausada", "Quitada"] as const

export const INCOME_TYPES = [
  "Salário",
  "Freelance",
  "Pensão",
  "Renda extra",
  "Mesada",
  "Outros",
] as const

export const INCOME_FREQUENCIES = ["Mensal", "Quinzenal", "Semanal", "Única"] as const

export const REMINDER_TYPES = ["Recorrente", "Parcelado"] as const

export const REMINDER_FREQUENCIES = ["Mensal", "Quinzenal", "Semanal"] as const

export const REMINDER_STATUSES = ["Ativo", "Pausado", "Concluído"] as const

export const GOAL_STATUSES = ["Ativa", "Pausada", "Concluída"] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]
export type IncomeType = (typeof INCOME_TYPES)[number]
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number]
export type ReminderType = (typeof REMINDER_TYPES)[number]
export type ReminderFrequency = (typeof REMINDER_FREQUENCIES)[number]
export type ReminderStatus = (typeof REMINDER_STATUSES)[number]
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export type FixedExpense = {
  id: string
  name: string
  category: ExpenseCategory
  monthlyAmount: number
  dueDay: number
  totalInstallments: number
  remainingInstallments: number
  status: ExpenseStatus
  notes: string
  createdAt: string
}

export type Income = {
  id: string
  name: string
  type: IncomeType
  amount: number
  frequency: IncomeFrequency
  notes: string
  receivedOn: string | null
  createdAt: string
}

export type ChargeReminder = {
  id: string
  name: string
  person: string
  type: ReminderType
  amount: number
  frequency: ReminderFrequency
  nextDueDate: string
  totalInstallments: number
  remainingInstallments: number
  status: ReminderStatus
  notes: string
  createdAt: string
}

export type InvestmentEntry = {
  id: string
  month: string
  plannedAmount: number
  investedAmount: number
  notes: string
  createdAt: string
}

export type Goal = {
  id: string
  name: string
  notes: string
  status: GoalStatus
  targetAmount: number
  targetDate: string | null
  createdAt: string
}

export type GoalContribution = {
  id: string
  amount: number
  createdAt: string
  date: string
  goalId: string
  notes: string
}

export type MonthlySnapshot = {
  id: string
  month: string
  income: number
  expenses: number
  plannedInvestment: number
  investedAmount: number
}

export type FinanceState = {
  incomes: Income[]
  expenses: FixedExpense[]
  goals: Goal[]
  goalContributions: GoalContribution[]
  reminders: ChargeReminder[]
  investments: InvestmentEntry[]
  snapshots: MonthlySnapshot[]
}

export type FinanceSummary = {
  monthlyIncome: number
  fixedExpenses: number
  budgetAvailable: number
  plannedInvestment: number
  investedAmount: number
  budgetRemainingAfterInvestment: number
  committedPercent: number
  investmentDelta: number
  investmentInsight: "above" | "below" | "on-track"
  activeExpensesCount: number
  debtInstallmentsRemaining: number
}
