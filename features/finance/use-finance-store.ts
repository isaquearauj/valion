"use client"

import { useEffect, useState } from "react"

import { createInitialFinanceState } from "@/features/finance/initial-data"
import type {
  ChargeReminder,
  Goal,
  GoalContribution,
  FinanceState,
  FixedExpense,
  Income,
  InvestmentEntry,
  ReminderFrequency,
} from "@/features/finance/types"

export const FINANCE_STORAGE_KEY = "controle-financeiro:workspace:v1"

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function advanceReminderDate(dateKey: string, frequency: ReminderFrequency) {
  const date = parseDateKey(dateKey)

  if (!date) {
    return dateKey
  }

  if (frequency === "Semanal") {
    date.setDate(date.getDate() + 7)
  }

  if (frequency === "Quinzenal") {
    date.setDate(date.getDate() + 15)
  }

  if (frequency === "Mensal") {
    date.setMonth(date.getMonth() + 1)
  }

  return formatDateKey(date)
}

function normalizeFinanceState(state: Partial<FinanceState>): FinanceState {
  const initialState = createInitialFinanceState()

  return {
    expenses: Array.isArray(state.expenses) ? state.expenses : [],
    goalContributions: Array.isArray(state.goalContributions)
      ? state.goalContributions
      : [],
    goals: Array.isArray(state.goals) ? state.goals : [],
    incomes: Array.isArray(state.incomes) ? state.incomes : [],
    investments: Array.isArray(state.investments) ? state.investments : [],
    reminders: Array.isArray(state.reminders) ? state.reminders : initialState.reminders,
    snapshots: Array.isArray(state.snapshots) ? state.snapshots : [],
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  }
}

function readStoredState() {
  if (typeof window === "undefined") {
    return createInitialFinanceState()
  }

  const stored = window.localStorage.getItem(FINANCE_STORAGE_KEY)

  if (!stored) {
    return createInitialFinanceState()
  }

  try {
    return normalizeFinanceState(JSON.parse(stored) as Partial<FinanceState>)
  } catch {
    return createInitialFinanceState()
  }
}

function touch(state: FinanceState): FinanceState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  }
}

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(() => createInitialFinanceState())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      setState(readStoredState())
      setIsReady(true)
    })

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state))
  }, [isReady, state])

  function resetWorkspace() {
    const nextState = createInitialFinanceState()
    setState(nextState)
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(nextState))
  }

  function clearWorkspace() {
    const nextState: FinanceState = {
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
      updatedAt: new Date().toISOString(),
    }
    setState(nextState)
    window.localStorage.removeItem(FINANCE_STORAGE_KEY)
  }

  function upsertIncome(values: Omit<Income, "createdAt" | "id">, id?: string) {
    setState((current) => {
      const now = new Date().toISOString()
      const exists = current.incomes.some((income) => income.id === id)
      const incomes = exists
        ? current.incomes.map((income) =>
            income.id === id ? { ...income, ...values } : income
          )
        : [
            {
              ...values,
              createdAt: now,
              id: createId("inc"),
            },
            ...current.incomes,
          ]

      return touch({ ...current, incomes })
    })
  }

  function deleteIncome(id: string) {
    setState((current) =>
      touch({
        ...current,
        incomes: current.incomes.filter((income) => income.id !== id),
      })
    )
  }

  function upsertReminder(values: Omit<ChargeReminder, "createdAt" | "id">, id?: string) {
    setState((current) => {
      const now = new Date().toISOString()
      const exists = current.reminders.some((reminder) => reminder.id === id)
      const reminders = exists
        ? current.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...values } : reminder
          )
        : [
            {
              ...values,
              createdAt: now,
              id: createId("rem"),
            },
            ...current.reminders,
          ]

      return touch({ ...current, reminders })
    })
  }

  function deleteReminder(id: string) {
    setState((current) =>
      touch({
        ...current,
        reminders: current.reminders.filter((reminder) => reminder.id !== id),
      })
    )
  }

  function markReminderReceived(id: string) {
    setState((current) => {
      let wasUpdated = false
      const reminders = current.reminders.map((reminder) => {
        if (reminder.id !== id || reminder.status !== "Ativo") {
          return reminder
        }

        wasUpdated = true

        if (reminder.type === "Parcelado") {
          const remainingInstallments = Math.max(reminder.remainingInstallments - 1, 0)
          const isCompleted = remainingInstallments === 0
          const status: ChargeReminder["status"] = isCompleted ? "Concluído" : reminder.status

          return {
            ...reminder,
            nextDueDate: isCompleted
              ? reminder.nextDueDate
              : advanceReminderDate(reminder.nextDueDate, reminder.frequency),
            remainingInstallments,
            status,
          }
        }

        return {
          ...reminder,
          nextDueDate: advanceReminderDate(reminder.nextDueDate, reminder.frequency),
        }
      })

      return wasUpdated ? touch({ ...current, reminders }) : current
    })
  }

  function upsertExpense(
    values: Omit<FixedExpense, "createdAt" | "id">,
    id?: string
  ) {
    setState((current) => {
      const now = new Date().toISOString()
      const exists = current.expenses.some((expense) => expense.id === id)
      const expenses = exists
        ? current.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...values } : expense
          )
        : [
            {
              ...values,
              createdAt: now,
              id: createId("exp"),
            },
            ...current.expenses,
          ]

      return touch({ ...current, expenses })
    })
  }

  function deleteExpense(id: string) {
    setState((current) =>
      touch({
        ...current,
        expenses: current.expenses.filter((expense) => expense.id !== id),
      })
    )
  }

  function upsertInvestment(
    values: Omit<InvestmentEntry, "createdAt" | "id">,
    id?: string
  ) {
    setState((current) => {
      const now = new Date().toISOString()
      const existingId =
        id ?? current.investments.find((investment) => investment.month === values.month)?.id
      const exists = current.investments.some(
        (investment) => investment.id === existingId
      )
      const investments = exists
        ? current.investments.map((investment) =>
            investment.id === existingId ? { ...investment, ...values } : investment
          )
        : [
            {
              ...values,
              createdAt: now,
              id: createId("inv"),
            },
            ...current.investments,
          ]

      return touch({ ...current, investments })
    })
  }

  function upsertGoal(values: Omit<Goal, "createdAt" | "id">, id?: string) {
    setState((current) => {
      const now = new Date().toISOString()
      const exists = current.goals.some((goal) => goal.id === id)
      const goals = exists
        ? current.goals.map((goal) => (goal.id === id ? { ...goal, ...values } : goal))
        : [
            {
              ...values,
              createdAt: now,
              id: createId("goal"),
            },
            ...current.goals,
          ]

      return touch({ ...current, goals })
    })
  }

  function deleteGoal(id: string) {
    setState((current) =>
      touch({
        ...current,
        goalContributions: current.goalContributions.filter(
          (contribution) => contribution.goalId !== id
        ),
        goals: current.goals.filter((goal) => goal.id !== id),
      })
    )
  }

  function upsertGoalContribution(
    values: Omit<GoalContribution, "createdAt" | "id">,
    id?: string
  ) {
    setState((current) => {
      const now = new Date().toISOString()
      const exists = current.goalContributions.some((contribution) => contribution.id === id)
      const goalContributions = exists
        ? current.goalContributions.map((contribution) =>
            contribution.id === id ? { ...contribution, ...values } : contribution
          )
        : [
            {
              ...values,
              createdAt: now,
              id: createId("gcontrib"),
            },
            ...current.goalContributions,
          ]

      return touch({ ...current, goalContributions })
    })
  }

  function deleteGoalContribution(id: string) {
    setState((current) =>
      touch({
        ...current,
        goalContributions: current.goalContributions.filter(
          (contribution) => contribution.id !== id
        ),
      })
    )
  }

  function deleteInvestment(id: string) {
    setState((current) =>
      touch({
        ...current,
        investments: current.investments.filter(
          (investment) => investment.id !== id
        ),
      })
    )
  }

  return {
    clearWorkspace,
    deleteExpense,
    deleteGoal,
    deleteGoalContribution,
    deleteIncome,
    deleteInvestment,
    deleteReminder,
    isReady,
    markReminderReceived,
    resetWorkspace,
    state,
    upsertExpense,
    upsertGoal,
    upsertGoalContribution,
    upsertIncome,
    upsertInvestment,
    upsertReminder,
  }
}
