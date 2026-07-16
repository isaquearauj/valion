import {
  type FinanceSupabaseClient,
  getRepositoryData,
} from "@/features/finance/data/repositories/types"
import { REMINDER_COLUMNS } from "@/features/finance/data/repositories/workspace-repository"
import { mapChargeReminder } from "@/features/finance/data/supabase-mappers"
import type { ChargeReminder, ReminderFrequency } from "@/features/finance/domain/types"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function advanceReminderDate(dateKey: string, frequency: ReminderFrequency) {
  const date = parseDateKey(dateKey)

  if (frequency === "Semanal") date.setDate(date.getDate() + 7)
  if (frequency === "Quinzenal") date.setDate(date.getDate() + 15)
  if (frequency === "Mensal") date.setMonth(date.getMonth() + 1)

  return formatDateKey(date)
}

export async function saveReminder(
  client: FinanceSupabaseClient,
  userId: string,
  values: Omit<ChargeReminder, "createdAt" | "id">,
  id?: string,
) {
  const payload: TablesInsert<"charge_reminders"> = {
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
  const query = id
    ? client
        .from("charge_reminders")
        .update(payload satisfies TablesUpdate<"charge_reminders">)
        .eq("id", id)
        .eq("user_id", userId)
    : client.from("charge_reminders").insert(payload)
  const { data, error } = await query.select(REMINDER_COLUMNS).single()

  return mapChargeReminder(getRepositoryData(data, error, "Não foi possível salvar o lembrete."))
}

export async function removeReminder(client: FinanceSupabaseClient, userId: string, id: string) {
  const { data, error } = await client
    .from("charge_reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select(REMINDER_COLUMNS)
    .single()

  return mapChargeReminder(getRepositoryData(data, error, "Não foi possível excluir o lembrete."))
}

export async function receiveReminder(
  client: FinanceSupabaseClient,
  userId: string,
  reminder: ChargeReminder,
) {
  const remainingInstallments =
    reminder.type === "Parcelado"
      ? Math.max(reminder.remainingInstallments - 1, 0)
      : reminder.remainingInstallments
  const isCompleted = reminder.type === "Parcelado" && remainingInstallments === 0
  const update: TablesUpdate<"charge_reminders"> = {
    next_due_date: isCompleted
      ? reminder.nextDueDate
      : advanceReminderDate(reminder.nextDueDate, reminder.frequency),
    remaining_installments: remainingInstallments,
    status: isCompleted ? "Concluído" : reminder.status,
  }
  const { data, error } = await client
    .from("charge_reminders")
    .update(update)
    .eq("id", reminder.id)
    .eq("user_id", userId)
    .select(REMINDER_COLUMNS)
    .single()

  return mapChargeReminder(getRepositoryData(data, error, "Não foi possível atualizar o lembrete."))
}
