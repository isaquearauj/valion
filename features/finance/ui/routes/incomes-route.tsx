"use client"

import { CheckCircle2Icon, Edit3Icon, PlusIcon, Trash2Icon } from "lucide-react"
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
import type { ChargeReminder, Income } from "@/features/finance/domain/types"
import { normalizeReminderFormValues } from "@/features/finance/presentation/dashboard-view-models"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { IncomeDialog, ReminderDialog } from "@/features/finance/ui/routes/incomes-dialogs"
import { SectionHeader } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDateKey } from "@/lib/formatters"

type DeleteTarget = { id: string; kind: "income" | "reminder"; label: string }

export function IncomesRoute() {
  const finance = useFinance()
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editingReminder, setEditingReminder] = useState<ChargeReminder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  function openIncome(income: Income | null) {
    setEditingIncome(income)
    setIncomeDialogOpen(true)
  }

  function openReminder(reminder: ChargeReminder | null) {
    setEditingReminder(reminder)
    setReminderDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    if (deleteTarget.kind === "income") await finance.incomes.remove(deleteTarget.id)
    else await finance.reminders.remove(deleteTarget.id)
    toast.success(deleteTarget.kind === "income" ? "Receita excluída" : "Lembrete excluído")
    setDeleteTarget(null)
  }

  const deletePending = deleteTarget
    ? finance.isPending(`${deleteTarget.kind}:remove:${deleteTarget.id}`)
    : false

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Cadastre entradas recorrentes ou pontuais e acompanhe cobranças a receber."
        title="Controle de receitas"
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openIncome(null)}>
          <PlusIcon data-icon="inline-start" /> Nova receita
        </Button>
        <Button onClick={() => openReminder(null)} variant="outline">
          <PlusIcon data-icon="inline-start" /> Novo lembrete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.state.incomes.length ? (
                finance.state.incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-medium">{income.name}</TableCell>
                    <TableCell>{income.frequency}</TableCell>
                    <TableCell>
                      {income.receivedOn ? formatDateKey(income.receivedOn) : "Recorrente"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(income.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Editar ${income.name}`}
                        onClick={() => openIncome(income)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Edit3Icon />
                      </Button>
                      <Button
                        aria-label={`Excluir ${income.name}`}
                        disabled={finance.isPending(`income:remove:${income.id}`)}
                        onClick={() =>
                          setDeleteTarget({ id: income.id, kind: "income", label: income.name })
                        }
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
                    Nenhuma receita cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lembretes de cobrança</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {finance.state.reminders.length ? (
            finance.state.reminders.map((reminder) => (
              <div className="rounded-2xl border bg-card p-4" key={reminder.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{reminder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {reminder.person} · {formatDateKey(reminder.nextDueDate)}
                    </p>
                  </div>
                  <p className="font-mono font-semibold">{formatCurrency(reminder.amount)}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    disabled={
                      finance.isPending(`reminder:receive:${reminder.id}`) ||
                      reminder.status !== "Ativo"
                    }
                    onClick={async () => {
                      await finance.reminders.markReceived(reminder.id)
                      toast.success("Cobrança atualizada")
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <CheckCircle2Icon data-icon="inline-start" /> Recebida
                  </Button>
                  <Button onClick={() => openReminder(reminder)} size="sm" variant="ghost">
                    Editar
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteTarget({ id: reminder.id, kind: "reminder", label: reminder.name })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum lembrete cadastrado.</p>
          )}
        </CardContent>
      </Card>

      {incomeDialogOpen ? (
        <IncomeDialog
          income={editingIncome}
          onOpenChange={setIncomeDialogOpen}
          onSubmit={async (values) => {
            await finance.incomes.save(values, editingIncome?.id)
            toast.success(editingIncome ? "Receita atualizada" : "Receita adicionada")
          }}
          open={incomeDialogOpen}
        />
      ) : null}
      {reminderDialogOpen ? (
        <ReminderDialog
          onOpenChange={setReminderDialogOpen}
          onSubmit={async (values) => {
            await finance.reminders.save(normalizeReminderFormValues(values), editingReminder?.id)
            toast.success(editingReminder ? "Lembrete atualizado" : "Lembrete adicionado")
          }}
          open={reminderDialogOpen}
          reminder={editingReminder}
        />
      ) : null}
      <ConfirmDialog
        description={deleteTarget ? `“${deleteTarget.label}” será removido permanentemente.` : ""}
        isPending={deletePending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        open={Boolean(deleteTarget)}
        title="Confirmar exclusão?"
      />
    </div>
  )
}
