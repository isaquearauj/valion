"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { InvestmentEntry } from "@/features/finance/domain/types"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { InvestmentDialog } from "@/features/finance/ui/dialogs"
import { InvestmentsSection } from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatMonth } from "@/lib/formatters"

export function InvestmentsView() {
  const finance = useFinance()
  const { state } = finance
  const summary = useMemo(() => calculateFinanceSummary(state), [state])

  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentEntry | null>(null)
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentEntry | null>(null)

  async function runAction(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      toast.success(successMsg)
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getActionErrorMessage(error) })
      throw error
    }
  }

  const openInvestmentDialog = useCallback((investment?: InvestmentEntry) => {
    setEditingInvestment(investment ?? null)
    setIsInvestmentDialogOpen(true)
  }, [])

  const handleAddInvestment = useCallback(() => {
    openInvestmentDialog()
  }, [openInvestmentDialog])

  const handleDeleteInvestment = useCallback((investment: InvestmentEntry) => {
    setInvestmentToDelete(investment)
  }, [])

  const sortedInvestments = useMemo(
    () => state.investments.toSorted((a, b) => b.month.localeCompare(a.month)),
    [state.investments],
  )

  return (
    <>
      <InvestmentsSection
        investments={sortedInvestments}
        onAdd={handleAddInvestment}
        onDelete={handleDeleteInvestment}
        onEdit={openInvestmentDialog}
        summary={summary}
      />

      {isInvestmentDialogOpen ? (
        <InvestmentDialog
          investment={editingInvestment}
          onOpenChange={setIsInvestmentDialogOpen}
          onSubmit={async (values) => {
            await runAction(
              () => finance.investments.save(values, editingInvestment?.id),
              editingInvestment ? "Investimento atualizado" : "Investimento registrado",
            )
          }}
          open={isInvestmentDialogOpen}
        />
      ) : null}

      <ConfirmDialog
        confirmText="Excluir investimento"
        destructive
        onConfirm={async () => {
          if (investmentToDelete) {
            await runAction(
              () => finance.investments.remove(investmentToDelete.id),
              "Investimento excluído",
            )
          }
        }}
        onOpenChange={(open) => !open && setInvestmentToDelete(null)}
        open={Boolean(investmentToDelete)}
        title={
          investmentToDelete
            ? `Excluir o registro de ${formatMonth(investmentToDelete.month)}?`
            : "Excluir investimento?"
        }
      />
    </>
  )
}
