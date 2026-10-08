"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { FixedExpense } from "@/features/finance/domain/types"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { ExpenseDialog } from "@/features/finance/ui/dialogs"
import { ExpensesSection } from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"

export function ExpensesView() {
  const finance = useFinance()
  const { state } = finance
  const summary = useMemo(() => calculateFinanceSummary(state), [state])

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<FixedExpense | null>(null)

  async function runAction(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getActionErrorMessage(error) })
      throw error
    }
  }

  const openExpenseDialog = useCallback((expense?: FixedExpense) => {
    setEditingExpense(expense ?? null)
    setIsExpenseDialogOpen(true)
  }, [])

  const handleAddExpense = useCallback(() => {
    openExpenseDialog()
  }, [openExpenseDialog])

  const handleDeleteExpense = useCallback((expense: FixedExpense) => {
    setExpenseToDelete(expense)
  }, [])

  return (
    <>
      <ExpensesSection
        expenses={state.expenses}
        onAdd={handleAddExpense}
        onDelete={handleDeleteExpense}
        onEdit={openExpenseDialog}
        summary={summary}
      />

      {isExpenseDialogOpen ? (
        <ExpenseDialog
          expense={editingExpense}
          onOpenChange={setIsExpenseDialogOpen}
          onSubmit={async (values) => {
            await runAction(
              () => finance.expenses.save(values, editingExpense?.id),
              editingExpense ? "Despesa atualizada" : "Despesa adicionada",
            )
          }}
          open={isExpenseDialogOpen}
        />
      ) : null}

      <ConfirmDialog
        confirmText="Excluir despesa"
        destructive
        onConfirm={async () => {
          if (expenseToDelete) {
            await runAction(() => finance.expenses.remove(expenseToDelete.id), "Despesa excluída")
          }
        }}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        open={Boolean(expenseToDelete)}
        title={`Excluir a despesa "${expenseToDelete?.name}"?`}
      />
    </>
  )
}
