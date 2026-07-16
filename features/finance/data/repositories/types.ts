import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type FinanceSupabaseClient = SupabaseClient<Database>

export function assertRepositorySuccess(
  error: { message: string } | null,
  message = "Não foi possível salvar os dados.",
) {
  if (error) {
    throw new Error(message)
  }
}

export function getRepositoryData<T>(
  data: T | null,
  error: { message: string } | null,
  message: string,
) {
  assertRepositorySuccess(error, message)
  if (!data) throw new Error(message)
  return data
}
