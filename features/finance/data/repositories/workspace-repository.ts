import type { FinanceSupabaseClient } from "@/features/finance/data/repositories/types"
import {
  mapChargeReminder,
  mapFixedExpense,
  mapGoal,
  mapGoalContribution,
  mapIncome,
  mapInvestmentEntry,
  mapMonthlySnapshot,
} from "@/features/finance/data/supabase-mappers"
import type { FinanceState, MonthlySnapshot } from "@/features/finance/domain/types"

export const INCOME_COLUMNS =
  "id,user_id,name,type,amount,frequency,notes,received_on,created_at,updated_at"
export const EXPENSE_COLUMNS =
  "id,user_id,name,category,monthly_amount,due_day,total_installments,remaining_installments,status,notes,created_at,updated_at"
export const REMINDER_COLUMNS =
  "id,user_id,name,person,type,amount,frequency,next_due_date,total_installments,remaining_installments,status,notes,created_at,updated_at"
export const INVESTMENT_COLUMNS =
  "id,user_id,month,planned_amount,invested_amount,notes,created_at,updated_at"
export const GOAL_COLUMNS =
  "id,user_id,name,target_amount,target_date,status,notes,created_at,updated_at"
export const GOAL_CONTRIBUTION_COLUMNS =
  "id,user_id,goal_id,amount,date,notes,created_at,updated_at"
export const SNAPSHOT_COLUMNS =
  "id,user_id,month,income,expenses,planned_investment,invested_amount,created_at,updated_at"

function withAbort<T extends { abortSignal: (signal: AbortSignal) => T }>(
  query: T,
  signal?: AbortSignal,
) {
  return signal ? query.abortSignal(signal) : query
}

export async function listSnapshots(
  client: FinanceSupabaseClient,
  userId: string,
): Promise<MonthlySnapshot[]> {
  const { data, error } = await client
    .from("monthly_snapshots")
    .select(SNAPSHOT_COLUMNS)
    .eq("user_id", userId)
    .order("month", { ascending: true })

  if (error) {
    throw new Error("Não foi possível atualizar o histórico.")
  }

  return (data ?? []).map(mapMonthlySnapshot)
}

export async function loadFinanceWorkspace(
  client: FinanceSupabaseClient,
  userId: string,
  signal?: AbortSignal,
): Promise<FinanceState> {
  const ensured = await client.rpc("ensure_current_month_snapshot")

  if (ensured.error) {
    throw new Error("Não foi possível preparar o resumo do mês.")
  }

  const results = await Promise.all([
    withAbort(
      client
        .from("incomes")
        .select(INCOME_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      signal,
    ),
    withAbort(
      client
        .from("fixed_expenses")
        .select(EXPENSE_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      signal,
    ),
    withAbort(
      client
        .from("charge_reminders")
        .select(REMINDER_COLUMNS)
        .eq("user_id", userId)
        .order("next_due_date", { ascending: true }),
      signal,
    ),
    withAbort(
      client
        .from("investment_entries")
        .select(INVESTMENT_COLUMNS)
        .eq("user_id", userId)
        .order("month", { ascending: false }),
      signal,
    ),
    withAbort(
      client
        .from("financial_goals")
        .select(GOAL_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      signal,
    ),
    withAbort(
      client
        .from("goal_contributions")
        .select(GOAL_CONTRIBUTION_COLUMNS)
        .eq("user_id", userId)
        .order("date", { ascending: false }),
      signal,
    ),
    withAbort(
      client
        .from("monthly_snapshots")
        .select(SNAPSHOT_COLUMNS)
        .eq("user_id", userId)
        .order("month", { ascending: true }),
      signal,
    ),
  ])

  if (results.some((result) => result.error)) {
    throw new Error("Não foi possível carregar seus dados financeiros.")
  }

  const [incomes, expenses, reminders, investments, goals, contributions, snapshots] = results

  return {
    expenses: (expenses.data ?? []).map(mapFixedExpense),
    goalContributions: (contributions.data ?? []).map(mapGoalContribution),
    goals: (goals.data ?? []).map(mapGoal),
    incomes: (incomes.data ?? []).map(mapIncome),
    investments: (investments.data ?? []).map(mapInvestmentEntry),
    reminders: (reminders.data ?? []).map(mapChargeReminder),
    snapshots: (snapshots.data ?? []).map(mapMonthlySnapshot),
  }
}
