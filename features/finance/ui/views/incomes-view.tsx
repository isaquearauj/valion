"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { ChargeReminder, Income } from "@/features/finance/domain/types"
import { normalizeReminderFormValues } from "@/features/finance/presentation/dashboard-view-models"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { IncomesSection } from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"

const IncomeDialog = dynamic(
  () => import("@/features/finance/ui/dialogs/income-dialog").then((mod) => mod.IncomeDialog),
  { ssr: false },
)

const ReminderDialog = dynamic(
  () => import("@/features/finance/ui/dialogs/reminder-dialog").then((mod) => mod.ReminderDialog),
  { ssr: false },
)

export function IncomesView() {
  const finance = useFinance()
  const { state } = finance
  const summary = useMemo(() => calculateFinanceSummary(state), [state])

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ChargeReminder | null>(null)

  async function runAction(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getActionErrorMessage(error) })
      throw error
    }
  }

  function openIncomeDialog(income?: Income) {
    setEditingIncome(income ?? null)
    setIsIncomeDialogOpen(true)
  }

  function openReminderDialog(reminder?: ChargeReminder) {
    setEditingReminder(reminder ?? null)
    setIsReminderDialogOpen(true)
  }

  async function handleDeleteIncome(income: Income) {
    if (!window.confirm(`Excluir a receita "${income.name}"?`)) return
    await runAction(() => finance.incomes.remove(income.id), "Receita excluída")
  }

  async function handleDeleteReminder(reminder: ChargeReminder) {
    if (!window.confirm(`Excluir o lembrete "${reminder.name}"?`)) return
    await runAction(() => finance.reminders.remove(reminder.id), "Lembrete excluído")
  }

  async function handleMarkReminderReceived(reminder: ChargeReminder) {
    await runAction(
      () => finance.reminders.markReceived(reminder.id),
      reminder.type === "Parcelado" && reminder.remainingInstallments <= 1
        ? "Lembrete concluído"
        : "Cobrança marcada como recebida",
    )
  }

  return (
    <>
      <IncomesSection
        incomes={state.incomes}
        onAdd={() => openIncomeDialog()}
        onAddReminder={() => openReminderDialog()}
        onDelete={handleDeleteIncome}
        onDeleteReminder={handleDeleteReminder}
        onEdit={openIncomeDialog}
        onEditReminder={openReminderDialog}
        onMarkReminderReceived={handleMarkReminderReceived}
        reminders={state.reminders}
        summary={summary}
      />

      {isIncomeDialogOpen ? (
        <IncomeDialog
          income={editingIncome}
          onOpenChange={setIsIncomeDialogOpen}
          onSubmit={async (values) => {
            await runAction(
              () => finance.incomes.save(values, editingIncome?.id),
              editingIncome ? "Receita atualizada" : "Receita adicionada",
            )
          }}
          open={isIncomeDialogOpen}
        />
      ) : null}

      {isReminderDialogOpen ? (
        <ReminderDialog
          onOpenChange={setIsReminderDialogOpen}
          onSubmit={async (values) => {
            await runAction(
              () =>
                finance.reminders.save(normalizeReminderFormValues(values), editingReminder?.id),
              editingReminder ? "Lembrete atualizado" : "Lembrete adicionado",
            )
          }}
          open={isReminderDialogOpen}
          reminder={editingReminder}
        />
      ) : null}
    </>
  )
}
