"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { removeExpense, saveExpense } from "@/features/finance/data/repositories/expense-repository"
import {
  removeGoal,
  removeGoalContribution,
  saveGoal,
  saveGoalContribution,
} from "@/features/finance/data/repositories/goal-repository"
import { removeIncome, saveIncome } from "@/features/finance/data/repositories/income-repository"
import {
  removeInvestment,
  saveInvestment,
} from "@/features/finance/data/repositories/investment-repository"
import {
  receiveReminder,
  removeReminder,
  saveReminder,
} from "@/features/finance/data/repositories/reminder-repository"
import {
  listSnapshots,
  loadFinanceWorkspace,
} from "@/features/finance/data/repositories/workspace-repository"
import { createEmptyFinanceState } from "@/features/finance/data/supabase-mappers"
import type {
  ChargeReminder,
  FinanceState,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"
import { createSupabaseBrowser } from "@/lib/supabase/client"

export type FinanceStatus = "error" | "loading" | "ready"

export type FinanceStore = {
  state: FinanceState
  status: FinanceStatus
  error: string | null
  retry: () => Promise<void>
  isPending: (actionKey: string) => boolean
  incomes: {
    save: (values: Omit<Income, "createdAt" | "id">, id?: string) => Promise<void>
    remove: (id: string) => Promise<void>
  }
  expenses: {
    save: (values: Omit<FixedExpense, "createdAt" | "id">, id?: string) => Promise<void>
    remove: (id: string) => Promise<void>
  }
  reminders: {
    save: (values: Omit<ChargeReminder, "createdAt" | "id">, id?: string) => Promise<void>
    remove: (id: string) => Promise<void>
    markReceived: (id: string) => Promise<void>
  }
  investments: {
    save: (values: Omit<InvestmentEntry, "createdAt" | "id">, id?: string) => Promise<void>
    remove: (id: string) => Promise<void>
  }
  goals: {
    save: (values: Omit<Goal, "createdAt" | "id">, id?: string) => Promise<void>
    remove: (id: string) => Promise<void>
    saveContribution: (
      values: Omit<GoalContribution, "createdAt" | "id">,
      id?: string,
    ) => Promise<void>
    removeContribution: (id: string) => Promise<void>
  }
}

function replaceOrPrepend<T extends { id: string }>(items: T[], item: T) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items]
}

export function useFinanceStore(userId: string | null = null): FinanceStore {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [state, setState] = useState<FinanceState>(() => createEmptyFinanceState())
  const [status, setStatus] = useState<FinanceStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set())
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const userIdRef = useRef(userId)
  const pendingRef = useRef(new Set<string>())

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestedUserId = userId

    if (!requestedUserId) {
      setState(createEmptyFinanceState())
      setError(null)
      setStatus("ready")
      return
    }

    setError(null)
    setStatus("loading")

    try {
      const workspace = await loadFinanceWorkspace(supabase, requestedUserId, controller.signal)

      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current ||
        requestedUserId !== userIdRef.current
      ) {
        return
      }

      setState(workspace)
      setStatus("ready")
    } catch {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return
      }

      setError("Não foi possível carregar seus dados financeiros.")
      setStatus("error")
    }
  }, [supabase, userId])

  useEffect(() => {
    userIdRef.current = userId
    // O carregamento assíncrono é a sincronização desta store com o workspace remoto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()

    return () => {
      abortRef.current?.abort()
    }
  }, [load, userId])

  const runAction = useCallback(
    async (actionKey: string, action: (activeUserId: string) => Promise<void>) => {
      const activeUserId = userIdRef.current

      if (!activeUserId) {
        throw new Error("Sessão expirada. Entre novamente para continuar.")
      }

      if (pendingRef.current.has(actionKey)) {
        return
      }

      pendingRef.current.add(actionKey)
      setPendingKeys(new Set(pendingRef.current))

      try {
        await action(activeUserId)
      } finally {
        pendingRef.current.delete(actionKey)
        setPendingKeys(new Set(pendingRef.current))
      }
    },
    [],
  )

  const store = useMemo<FinanceStore>(
    () => ({
      error,
      expenses: {
        remove: (id) =>
          runAction(`expense:remove:${id}`, async (activeUserId) => {
            await removeExpense(supabase, activeUserId, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                expenses: current.expenses.filter((item) => item.id !== id),
                snapshots,
              }))
            }
          }),
        save: (values, id) =>
          runAction(`expense:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveExpense(supabase, activeUserId, values, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                expenses: replaceOrPrepend(current.expenses, item),
                snapshots,
              }))
            }
          }),
      },
      goals: {
        remove: (id) =>
          runAction(`goal:remove:${id}`, async (activeUserId) => {
            await removeGoal(supabase, activeUserId, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                goalContributions: current.goalContributions.filter((item) => item.goalId !== id),
                goals: current.goals.filter((item) => item.id !== id),
              }))
            }
          }),
        removeContribution: (id) =>
          runAction(`contribution:remove:${id}`, async (activeUserId) => {
            await removeGoalContribution(supabase, activeUserId, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                goalContributions: current.goalContributions.filter((item) => item.id !== id),
              }))
            }
          }),
        save: (values, id) =>
          runAction(`goal:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveGoal(supabase, activeUserId, values, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                goals: replaceOrPrepend(current.goals, item),
              }))
            }
          }),
        saveContribution: (values, id) =>
          runAction(`contribution:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveGoalContribution(supabase, activeUserId, values, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                goalContributions: replaceOrPrepend(current.goalContributions, item),
              }))
            }
          }),
      },
      incomes: {
        remove: (id) =>
          runAction(`income:remove:${id}`, async (activeUserId) => {
            await removeIncome(supabase, activeUserId, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                incomes: current.incomes.filter((item) => item.id !== id),
                snapshots,
              }))
            }
          }),
        save: (values, id) =>
          runAction(`income:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveIncome(supabase, activeUserId, values, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                incomes: replaceOrPrepend(current.incomes, item),
                snapshots,
              }))
            }
          }),
      },
      investments: {
        remove: (id) =>
          runAction(`investment:remove:${id}`, async (activeUserId) => {
            await removeInvestment(supabase, activeUserId, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                investments: current.investments.filter((item) => item.id !== id),
                snapshots,
              }))
            }
          }),
        save: (values, id) =>
          runAction(`investment:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveInvestment(supabase, activeUserId, values, id)
            const snapshots = await listSnapshots(supabase, activeUserId)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                investments: replaceOrPrepend(current.investments, item),
                snapshots,
              }))
            }
          }),
      },
      isPending: (actionKey) =>
        actionKey === "*" ? pendingKeys.size > 0 : pendingKeys.has(actionKey),
      reminders: {
        markReceived: (id) =>
          runAction(`reminder:receive:${id}`, async (activeUserId) => {
            const reminder = state.reminders.find((item) => item.id === id)
            if (reminder?.status !== "Ativo") return
            const item = await receiveReminder(supabase, activeUserId, reminder)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                reminders: replaceOrPrepend(current.reminders, item),
              }))
            }
          }),
        remove: (id) =>
          runAction(`reminder:remove:${id}`, async (activeUserId) => {
            await removeReminder(supabase, activeUserId, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                reminders: current.reminders.filter((item) => item.id !== id),
              }))
            }
          }),
        save: (values, id) =>
          runAction(`reminder:save:${id ?? "new"}`, async (activeUserId) => {
            const item = await saveReminder(supabase, activeUserId, values, id)
            if (activeUserId === userIdRef.current) {
              setState((current) => ({
                ...current,
                reminders: replaceOrPrepend(current.reminders, item),
              }))
            }
          }),
      },
      retry: load,
      state,
      status,
    }),
    [error, load, pendingKeys, runAction, state, status, supabase],
  )

  return store
}
