import {
  type FinanceSupabaseClient,
  getRepositoryData,
} from "@/features/finance/data/repositories/types"
import { INCOME_COLUMNS } from "@/features/finance/data/repositories/workspace-repository"
import { mapIncome } from "@/features/finance/data/supabase-mappers"
import type { Income } from "@/features/finance/domain/types"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

export async function saveIncome(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<Income, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"incomes"> = {
    amount: values.amount,
    frequency: values.frequency,
    name: values.name,
    notes: values.notes,
    received_on: values.frequency === "Única" ? values.receivedOn : null,
    type: values.type,
    user_id: userId,
  }
  const query = id
    ? client
        .from("incomes")
        .update(payload satisfies TablesUpdate<"incomes">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("incomes").insert(payload)
  const { data, error } = await query.select(INCOME_COLUMNS).single()

  return mapIncome(getRepositoryData(data, error, "Não foi possível salvar a receita."))
}

export async function removeIncome(client: FinanceSupabaseClient, userId: string, id: string) {
  const { data, error } = await client
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(INCOME_COLUMNS)
    .single()

  return mapIncome(getRepositoryData(data, error, "Não foi possível excluir a receita."))
}
