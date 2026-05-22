"use client"

import { useEffect, useState } from "react"

import { createDemoFinanceState } from "@/features/finance/demo-data"
import type {
  FinanceState,
  FixedExpense,
  Income,
  InvestmentEntry,
} from "@/features/finance/types"

export const FINANCE_STORAGE_KEY = "controle-financeiro:workspace:v1"

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function readStoredState() {
  if (typeof window === "undefined") {
    return createDemoFinanceState()
  }

  const stored = window.localStorage.getItem(FINANCE_STORAGE_KEY)

  if (!stored) {
    return createDemoFinanceState()
  }

  try {
    return JSON.parse(stored) as FinanceState
  } catch {
    return createDemoFinanceState()
  }
}

function touch(state: FinanceState): FinanceState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  }
}

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(() => createDemoFinanceState())
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
    const nextState = createDemoFinanceState()
    setState(nextState)
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(nextState))
  }

  function clearWorkspace() {
    const nextState: FinanceState = {
      expenses: [],
      incomes: [],
      investments: [],
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
    deleteIncome,
    deleteInvestment,
    isReady,
    resetWorkspace,
    state,
    upsertExpense,
    upsertIncome,
    upsertInvestment,
  }
}
