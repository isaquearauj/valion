import {
  type FinanceSupabaseClient,
  getRepositoryData,
} from "@/features/finance/data/repositories/types"
import { INVESTMENT_COLUMNS } from "@/features/finance/data/repositories/workspace-repository"
import { mapInvestmentEntry, monthKeyToDate } from "@/features/finance/data/supabase-mappers"
import type { InvestmentEntry } from "@/features/finance/domain/types"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

export async function saveInvestment(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<InvestmentEntry, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"investment_entries"> = {
    invested_amount: values.investedAmount,
    month: monthKeyToDate(values.month),
    notes: values.notes,
    planned_amount: values.plannedAmount,
    user_id: userId,
  }
  const query = id
    ? client
        .from("investment_entries")
        .update(payload satisfies TablesUpdate<"investment_entries">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("investment_entries").upsert(payload, { onConflict: "user_id,month" })
  const { data, error } = await query.select(INVESTMENT_COLUMNS).single()

  return mapInvestmentEntry(
    getRepositoryData(data, error, "Não foi possível salvar o investimento."),
  )
}

export async function removeInvestment(client: FinanceSupabaseClient, userId: string, id: string) {
  const { data, error } = await client
    .from("investment_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(INVESTMENT_COLUMNS)
    .single()

  return mapInvestmentEntry(
    getRepositoryData(data, error, "Não foi possível excluir o investimento."),
  )
}
