"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { ChargeReminder, Income } from "@/features/finance/domain/types"
import { normalizeReminderFormValues } from "@/features/finance/presentation/dashboard-view-models"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { IncomeDialog, ReminderDialog } from "@/features/finance/ui/dialogs"
import { IncomesSection } from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"

export function IncomesView() {
  const finance = useFinance()
  const { state } = finance
  const summary = useMemo(() => calculateFinanceSummary(state), [state])

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ChargeReminder | null>(null)

  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null)
  const [reminderToDelete, setReminderToDelete] = useState<ChargeReminder | null>(null)

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
        onDelete={(income) => setIncomeToDelete(income)}
        onDeleteReminder={(reminder) => setReminderToDelete(reminder)}
        onEdit={openIncomeDialog}
        onEditReminder={openReminderDialog}
        onMarkReminderReceived={handleMarkReminderReceived}
        reminders={state.reminders}
        summary={summary}
      />

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

      <ReminderDialog
        onOpenChange={setIsReminderDialogOpen}
        onSubmit={async (values) => {
          await runAction(
            () => finance.reminders.save(normalizeReminderFormValues(values), editingReminder?.id),
            editingReminder ? "Lembrete atualizado" : "Lembrete adicionado",
          )
        }}
        open={isReminderDialogOpen}
        reminder={editingReminder}
      />

      <ConfirmDialog
        confirmText="Excluir receita"
        destructive
        onConfirm={async () => {
          if (incomeToDelete) {
            await runAction(() => finance.incomes.remove(incomeToDelete.id), "Receita excluída")
          }
        }}
        onOpenChange={(open) => !open && setIncomeToDelete(null)}
        open={Boolean(incomeToDelete)}
        title={`Excluir a receita "${incomeToDelete?.name}"?`}
      />

      <ConfirmDialog
        confirmText="Excluir lembrete"
        destructive
        onConfirm={async () => {
          if (reminderToDelete) {
            await runAction(
              () => finance.reminders.remove(reminderToDelete.id),
              "Lembrete excluído",
            )
          }
        }}
        onOpenChange={(open) => !open && setReminderToDelete(null)}
        open={Boolean(reminderToDelete)}
        title={`Excluir o lembrete "${reminderToDelete?.name}"?`}
      />
    </>
  )
}
