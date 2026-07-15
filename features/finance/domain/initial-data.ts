import type { FinanceState } from "@/features/finance/domain/types"

export function getCurrentDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function createInitialFinanceState(): FinanceState {
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
