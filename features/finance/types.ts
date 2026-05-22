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

export const INCOME_FREQUENCIES = [
  "Mensal",
  "Quinzenal",
  "Semanal",
  "Única",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]
export type IncomeType = (typeof INCOME_TYPES)[number]
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number]

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
  investments: InvestmentEntry[]
  snapshots: MonthlySnapshot[]
  updatedAt: string
}

export type FinanceSummary = {
  monthlyIncome: number
  fixedExpenses: number
  freeBalance: number
  plannedInvestment: number
  investedAmount: number
  realAvailableBalance: number
  committedPercent: number
  investmentDelta: number
  investmentInsight: "above" | "below" | "on-track"
  activeExpensesCount: number
  debtInstallmentsRemaining: number
}

export type DemoUser = {
  id: string
  name: string
  email: string
  createdAt: string
}
