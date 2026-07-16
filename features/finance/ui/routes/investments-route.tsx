"use client"

import { Edit3Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InvestmentEntry } from "@/features/finance/domain/types"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { InvestmentDialog } from "@/features/finance/ui/routes/investment-dialog"
import { SectionHeader } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatMonth } from "@/lib/formatters"

export function InvestmentsRoute() {
  const finance = useFinance()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InvestmentEntry | null>(null)
  const [deleting, setDeleting] = useState<InvestmentEntry | null>(null)
  const investments = finance.state.investments.toSorted((a, b) => b.month.localeCompare(a.month))

  function openDialog(investment: InvestmentEntry | null) {
    setEditing(investment)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Compare o valor planejado com o que foi realmente investido em cada mês."
        title="Investimentos"
      />
      <div>
        <Button onClick={() => openDialog(null)}>
          <PlusIcon data-icon="inline-start" /> Registrar mês
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Planejado</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length ? (
                investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">{formatMonth(investment.month)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(investment.plannedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(investment.investedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(investment.investedAmount - investment.plannedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Editar ${formatMonth(investment.month)}`}
                        onClick={() => openDialog(investment)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Edit3Icon />
                      </Button>
                      <Button
                        aria-label={`Excluir ${formatMonth(investment.month)}`}
                        disabled={finance.isPending(`investment:remove:${investment.id}`)}
                        onClick={() => setDeleting(investment)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                    Nenhum investimento registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {dialogOpen ? (
        <InvestmentDialog
          investment={editing}
          onOpenChange={setDialogOpen}
          onSubmit={async (values) => {
            await finance.investments.save(values, editing?.id)
            toast.success(editing ? "Investimento atualizado" : "Investimento registrado")
          }}
          open={dialogOpen}
        />
      ) : null}
      <ConfirmDialog
        description={deleting ? `O registro de ${formatMonth(deleting.month)} será removido.` : ""}
        isPending={deleting ? finance.isPending(`investment:remove:${deleting.id}`) : false}
        onConfirm={async () => {
          if (!deleting) return
          await finance.investments.remove(deleting.id)
          toast.success("Investimento excluído")
          setDeleting(null)
        }}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        open={Boolean(deleting)}
        title="Excluir investimento?"
      />
    </div>
  )
}
