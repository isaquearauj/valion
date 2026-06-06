"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  ChargeReminder,
  FinanceState,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
  ReminderFrequency,
} from "@/features/finance/types"
import {
  createEmptyFinanceState,
  getWorkspaceUpdatedAt,
  mapChargeReminder,
  mapFixedExpense,
  mapGoal,
  mapGoalContribution,
  mapIncome,
  mapInvestmentEntry,
  mapMonthlySnapshot,
  monthKeyToDate,
  type ChargeReminderRow,
  type FixedExpenseRow,
  type GoalContributionRow,
  type GoalRow,
  type IncomeRow,
  type InvestmentEntryRow,
  type MonthlySnapshotRow,
} from "@/features/finance/supabase-mappers"
import { createSupabaseBrowser } from "@/lib/supabase/client"

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

function assertSupabaseSuccess(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message)
  }
}

export function useFinanceStore(userId: string | null = null) {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [state, setState] = useState<FinanceState>(() => createEmptyFinanceState())
  const [isReady, setIsReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspace = useCallback(async () => {
    if (!userId) {
      setState(createEmptyFinanceState())
      setIsReady(true)
      return
    }

    setError(null)

    const [
      incomesResult,
      expensesResult,
      remindersResult,
      investmentsResult,
      goalsResult,
      goalContributionsResult,
      snapshotsResult,
    ] = await Promise.all([
      supabase.from("incomes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("fixed_expenses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("charge_reminders").select("*").eq("user_id", userId).order("next_due_date", { ascending: true }),
      supabase.from("investment_entries").select("*").eq("user_id", userId).order("month", { ascending: false }),
      supabase.from("financial_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("goal_contributions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("monthly_snapshots").select("*").eq("user_id", userId).order("month", { ascending: true }),
    ])

    const results = [
      incomesResult,
      expensesResult,
      remindersResult,
      investmentsResult,
      goalsResult,
      goalContributionsResult,
      snapshotsResult,
    ]
    const failedResult = results.find((result) => result.error)

    if (failedResult?.error) {
      throw new Error(failedResult.error.message)
    }

    const incomeRows = (incomesResult.data ?? []) as IncomeRow[]
    const expenseRows = (expensesResult.data ?? []) as FixedExpenseRow[]
    const reminderRows = (remindersResult.data ?? []) as ChargeReminderRow[]
    const investmentRows = (investmentsResult.data ?? []) as InvestmentEntryRow[]
    const goalRows = (goalsResult.data ?? []) as GoalRow[]
    const goalContributionRows = (goalContributionsResult.data ?? []) as GoalContributionRow[]
    const snapshotRows = (snapshotsResult.data ?? []) as MonthlySnapshotRow[]

    setState({
      expenses: expenseRows.map(mapFixedExpense),
      goalContributions: goalContributionRows.map(mapGoalContribution),
      goals: goalRows.map(mapGoal),
      incomes: incomeRows.map(mapIncome),
      investments: investmentRows.map(mapInvestmentEntry),
      reminders: reminderRows.map(mapChargeReminder),
      snapshots: snapshotRows.map(mapMonthlySnapshot),
      updatedAt: getWorkspaceUpdatedAt([
        incomeRows,
        expenseRows,
        reminderRows,
        investmentRows,
        goalRows,
        goalContributionRows,
        snapshotRows,
      ]),
    })
    setIsReady(true)
  }, [supabase, userId])

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      loadWorkspace().catch((loadError: unknown) => {
        if (isCancelled) {
          return
        }

        const message = loadError instanceof Error ? loadError.message : "Não foi possível carregar seus dados."
        setError(message)
        setIsReady(true)
      })
    })

    return () => {
      isCancelled = true
    }
  }, [loadWorkspace])

  async function runMutation(mutation: () => Promise<void>) {
    if (!userId) {
      throw new Error("Sessão expirada. Entre novamente para continuar.")
    }

    setIsSaving(true)
    setError(null)

    try {
      await mutation()
      await loadWorkspace()
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Não foi possível salvar os dados."
      setError(message)
      throw mutationError
    } finally {
      setIsSaving(false)
    }
  }

  async function clearWorkspace() {
    await runMutation(async () => {
      const tables = [
        "goal_contributions",
        "monthly_snapshots",
        "investment_entries",
        "financial_goals",
        "fixed_expenses",
        "charge_reminders",
        "incomes",
      ]

      for (const table of tables) {
        const { error: deleteError } = await supabase.from(table).delete().eq("user_id", userId)
        assertSupabaseSuccess(deleteError)
      }
    })
  }

  async function resetWorkspace() {
    await clearWorkspace()
  }

  async function upsertIncome(values: Omit<Income, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        amount: values.amount,
        frequency: values.frequency,
        name: values.name,
        notes: values.notes,
        type: values.type,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("incomes").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("incomes").insert(payload)

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteIncome(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("incomes").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  async function upsertReminder(values: Omit<ChargeReminder, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        amount: values.amount,
        frequency: values.frequency,
        name: values.name,
        next_due_date: values.nextDueDate,
        notes: values.notes,
        person: values.person,
        remaining_installments: values.remainingInstallments,
        status: values.status,
        total_installments: values.totalInstallments,
        type: values.type,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("charge_reminders").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("charge_reminders").insert(payload)

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteReminder(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("charge_reminders").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  async function markReminderReceived(id: string) {
    const reminder = state.reminders.find((item) => item.id === id)

    if (!reminder || reminder.status !== "Ativo") {
      return
    }

    await runMutation(async () => {
      const remainingInstallments =
        reminder.type === "Parcelado" ? Math.max(reminder.remainingInstallments - 1, 0) : reminder.remainingInstallments
      const isCompleted = reminder.type === "Parcelado" && remainingInstallments === 0
      const { error: updateError } = await supabase
        .from("charge_reminders")
        .update({
          next_due_date: isCompleted ? reminder.nextDueDate : advanceReminderDate(reminder.nextDueDate, reminder.frequency),
          remaining_installments: remainingInstallments,
          status: isCompleted ? "Concluído" : reminder.status,
        })
        .eq("id", id)
        .eq("user_id", userId)

      assertSupabaseSuccess(updateError)
    })
  }

  async function upsertExpense(values: Omit<FixedExpense, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        category: values.category,
        due_day: values.dueDay,
        monthly_amount: values.monthlyAmount,
        name: values.name,
        notes: values.notes,
        remaining_installments: values.remainingInstallments,
        status: values.status,
        total_installments: values.totalInstallments,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("fixed_expenses").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("fixed_expenses").insert(payload)

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteExpense(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("fixed_expenses").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  async function upsertInvestment(values: Omit<InvestmentEntry, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        invested_amount: values.investedAmount,
        month: monthKeyToDate(values.month),
        notes: values.notes,
        planned_amount: values.plannedAmount,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("investment_entries").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("investment_entries").upsert(payload, { onConflict: "user_id,month" })

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteInvestment(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("investment_entries").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  async function upsertGoal(values: Omit<Goal, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        name: values.name,
        notes: values.notes,
        status: values.status,
        target_amount: values.targetAmount,
        target_date: values.targetDate,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("financial_goals").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("financial_goals").insert(payload)

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteGoal(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("financial_goals").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  async function upsertGoalContribution(values: Omit<GoalContribution, "createdAt" | "id">, id?: string) {
    await runMutation(async () => {
      const payload = {
        amount: values.amount,
        date: values.date,
        goal_id: values.goalId,
        notes: values.notes,
        user_id: userId,
      }
      const result = id
        ? await supabase.from("goal_contributions").update(payload).eq("id", id).eq("user_id", userId)
        : await supabase.from("goal_contributions").insert(payload)

      assertSupabaseSuccess(result.error)
    })
  }

  async function deleteGoalContribution(id: string) {
    await runMutation(async () => {
      const { error: deleteError } = await supabase.from("goal_contributions").delete().eq("id", id).eq("user_id", userId)
      assertSupabaseSuccess(deleteError)
    })
  }

  return {
    clearWorkspace,
    deleteExpense,
    deleteGoal,
    deleteGoalContribution,
    deleteIncome,
    deleteInvestment,
    deleteReminder,
    error,
    isReady,
    isSaving,
    markReminderReceived,
    reload: loadWorkspace,
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
