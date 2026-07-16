import {
  type FinanceSupabaseClient,
  getRepositoryData,
} from "@/features/finance/data/repositories/types"
import { EXPENSE_COLUMNS } from "@/features/finance/data/repositories/workspace-repository"
import { mapFixedExpense } from "@/features/finance/data/supabase-mappers"
import type { FixedExpense } from "@/features/finance/domain/types"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

export async function saveExpense(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<FixedExpense, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"fixed_expenses"> = {
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
  const query = id
    ? client
        .from("fixed_expenses")
        .update(payload satisfies TablesUpdate<"fixed_expenses">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("fixed_expenses").insert(payload)
  const { data, error } = await query.select(EXPENSE_COLUMNS).single()

  return mapFixedExpense(getRepositoryData(data, error, "Não foi possível salvar a despesa."))
}

export async function removeExpense(client: FinanceSupabaseClient, userId: string, id: string) {
  const { data, error } = await client
    .from("fixed_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(EXPENSE_COLUMNS)
    .single()

  return mapFixedExpense(getRepositoryData(data, error, "Não foi possível excluir a despesa."))
}
