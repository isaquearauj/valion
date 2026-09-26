"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { FixedExpense } from "@/features/finance/domain/types"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { ExpensesSection } from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"

const ExpenseDialog = dynamic(
  () => import("@/features/finance/ui/dialogs/expense-dialog").then((mod) => mod.ExpenseDialog),
  { ssr: false },
)

export function ExpensesView() {
  const finance = useFinance()
  const { state } = finance
  const summary = useMemo(() => calculateFinanceSummary(state), [state])

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)

  async function runAction(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getActionErrorMessage(error) })
      throw error
    }
  }

  function openExpenseDialog(expense?: FixedExpense) {
    setEditingExpense(expense ?? null)
    setIsExpenseDialogOpen(true)
  }

  async function handleDeleteExpense(expense: FixedExpense) {
    if (!window.confirm(`Excluir a despesa "${expense.name}"?`)) return
    await runAction(() => finance.expenses.remove(expense.id), "Despesa excluída")
  }

  return (
    <>
      <ExpensesSection
        expenses={state.expenses}
        onAdd={() => openExpenseDialog()}
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
    </>
  )
}
