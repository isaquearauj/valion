"use client"

import { useCallback, useMemo, useState } from "react"
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

  const runAction = useCallback(async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getActionErrorMessage(error) })
      throw error
    }
  }, [])

  const openIncomeDialog = useCallback((income?: Income) => {
    setEditingIncome(income ?? null)
    setIsIncomeDialogOpen(true)
  }, [])

  const handleAddIncome = useCallback(() => {
    openIncomeDialog()
  }, [openIncomeDialog])

  const openReminderDialog = useCallback((reminder?: ChargeReminder) => {
    setEditingReminder(reminder ?? null)
    setIsReminderDialogOpen(true)
  }, [])

  const handleAddReminder = useCallback(() => {
    openReminderDialog()
  }, [openReminderDialog])

  const handleDeleteIncome = useCallback((income: Income) => {
    setIncomeToDelete(income)
  }, [])

  const handleDeleteReminder = useCallback((reminder: ChargeReminder) => {
    setReminderToDelete(reminder)
  }, [])

  const handleMarkReminderReceived = useCallback(
    async (reminder: ChargeReminder) => {
      await runAction(
        () => finance.reminders.markReceived(reminder.id),
        reminder.type === "Parcelado" && reminder.remainingInstallments <= 1
          ? "Lembrete concluído"
          : "Cobrança marcada como recebida",
      )
    },
    [finance.reminders, runAction],
  )

  return (
    <>
      <IncomesSection
        incomes={state.incomes}
        onAdd={handleAddIncome}
        onAddReminder={handleAddReminder}
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
