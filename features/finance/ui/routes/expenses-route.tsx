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
import type { FixedExpense } from "@/features/finance/domain/types"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { ExpenseDialog } from "@/features/finance/ui/routes/expense-dialog"
import {
  ExpenseStatusBadge,
  SectionHeader,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDueDay } from "@/lib/formatters"

export function ExpensesRoute() {
  const finance = useFinance()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [deleting, setDeleting] = useState<FixedExpense | null>(null)

  function openDialog(expense: FixedExpense | null) {
    setEditing(expense)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Acompanhe compromissos mensais, parcelas e vencimentos."
        title="Despesas fixas"
      />
      <div>
        <Button onClick={() => openDialog(null)}>
          <PlusIcon data-icon="inline-start" /> Nova despesa
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compromissos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Despesa</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor mensal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.state.expenses.length ? (
                finance.state.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatDueDay(expense.dueDay)}</TableCell>
                    <TableCell>
                      <ExpenseStatusBadge status={expense.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(expense.monthlyAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Editar ${expense.name}`}
                        onClick={() => openDialog(expense)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Edit3Icon />
                      </Button>
                      <Button
                        aria-label={`Excluir ${expense.name}`}
                        disabled={finance.isPending(`expense:remove:${expense.id}`)}
                        onClick={() => setDeleting(expense)}
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
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                    Nenhuma despesa cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {dialogOpen ? (
        <ExpenseDialog
          expense={editing}
          onOpenChange={setDialogOpen}
          onSubmit={async (values) => {
            await finance.expenses.save(values, editing?.id)
            toast.success(editing ? "Despesa atualizada" : "Despesa adicionada")
          }}
          open={dialogOpen}
        />
      ) : null}
      <ConfirmDialog
        description={deleting ? `A despesa “${deleting.name}” será removida.` : ""}
        isPending={deleting ? finance.isPending(`expense:remove:${deleting.id}`) : false}
        onConfirm={async () => {
          if (!deleting) return
          await finance.expenses.remove(deleting.id)
          toast.success("Despesa excluída")
          setDeleting(null)
        }}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        open={Boolean(deleting)}
        title="Excluir despesa?"
      />
    </div>
  )
}
