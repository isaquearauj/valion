import {
  type FinanceSupabaseClient,
  getRepositoryData,
} from "@/features/finance/data/repositories/types"
import {
  GOAL_COLUMNS,
  GOAL_CONTRIBUTION_COLUMNS,
} from "@/features/finance/data/repositories/workspace-repository"
import { mapGoal, mapGoalContribution } from "@/features/finance/data/supabase-mappers"
import type { Goal, GoalContribution } from "@/features/finance/domain/types"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

export async function saveGoal(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<Goal, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"financial_goals"> = {
    name: values.name,
    notes: values.notes,
    status: values.status,
    target_amount: values.targetAmount,
    target_date: values.targetDate,
    user_id: userId,
  }
  const query = id
    ? client
        .from("financial_goals")
        .update(payload satisfies TablesUpdate<"financial_goals">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("financial_goals").insert(payload)
  const { data, error } = await query.select(GOAL_COLUMNS).single()

  return mapGoal(getRepositoryData(data, error, "Não foi possível salvar a meta."))
}

export async function removeGoal(client: FinanceSupabaseClient, userId: string, id: string) {
  const { data, error } = await client
    .from("financial_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(GOAL_COLUMNS)
    .single()

  return mapGoal(getRepositoryData(data, error, "Não foi possível excluir a meta."))
}

export async function saveGoalContribution(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<GoalContribution, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"goal_contributions"> = {
    amount: values.amount,
    date: values.date,
    goal_id: values.goalId,
    notes: values.notes,
    user_id: userId,
  }
  const query = id
    ? client
        .from("goal_contributions")
        .update(payload satisfies TablesUpdate<"goal_contributions">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("goal_contributions").insert(payload)
  const { data, error } = await query.select(GOAL_CONTRIBUTION_COLUMNS).single()

  return mapGoalContribution(getRepositoryData(data, error, "Não foi possível salvar o aporte."))
}

export async function removeGoalContribution(
  client: FinanceSupabaseClient,
  userId: string,
  id: string,
) {
  const { data, error } = await client
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(GOAL_CONTRIBUTION_COLUMNS)
    .single()

  return mapGoalContribution(getRepositoryData(data, error, "Não foi possível excluir o aporte."))
}
