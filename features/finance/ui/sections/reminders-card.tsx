"use client"

import { CheckCircle2Icon, PlusIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentDateKey } from "@/features/finance/domain/initial-data"
import type { ChargeReminder } from "@/features/finance/domain/types"
import {
  getReminderProgress,
  getReminderStatusPriority,
  isReminderDue,
} from "@/features/finance/presentation/dashboard-view-models"
import {
  PaginationControls,
  ReminderStatusBadge,
  ReminderTypeBadge,
  ResponsiveTable,
  TABLE_PAGE_SIZE,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDateKey } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const reminderActionClassName =
  "border-orange-400/40 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20"

export function RemindersCard({
  onAdd,
  onDelete,
  onEdit,
  onMarkReceived,
  reminders,
}: {
  onAdd: () => void
  onDelete: (reminder: ChargeReminder) => Promise<void> | void
  onEdit: (reminder: ChargeReminder) => void
  onMarkReceived: (reminder: ChargeReminder) => Promise<void> | void
  reminders: ChargeReminder[]
}) {
  const [page, setPage] = useState(1)
  const today = getCurrentDateKey()
  const orderedReminders = useMemo(
    () =>
      reminders.toSorted((a, b) => {
        const statusDelta = getReminderStatusPriority(a) - getReminderStatusPriority(b)

        if (statusDelta !== 0) {
          return statusDelta
        }

        return a.nextDueDate.localeCompare(b.nextDueDate)
      }),
    [reminders],
  )
  const pageCount = Math.max(Math.ceil(orderedReminders.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedReminders = useMemo(
    () =>
      orderedReminders.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, orderedReminders],
  )

  return (
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Lembretes</CardTitle>
          <CardDescription>
            Controle cobranças recorrentes ou parceladas sem interferir nas receitas do dashboard.
          </CardDescription>
        </div>
        <CardAction>
          <Button className={cn("min-w-[9.5rem]", reminderActionClassName)} onClick={onAdd}>
            <PlusIcon data-icon="inline-start" />
            Novo lembrete
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cobrança</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Próxima cobrança</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReminders.length ? (
                paginatedReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div className="font-medium">{reminder.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {reminder.person} · {reminder.notes || "Sem observações"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <ReminderTypeBadge type={reminder.type} />
                        <span className="text-xs text-muted-foreground">{reminder.frequency}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{formatDateKey(reminder.nextDueDate)}</span>
                        {isReminderDue(reminder, today) ? (
                          <span className="text-xs font-medium text-destructive">Cobrar agora</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Agendado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-36">
                      {reminder.type === "Parcelado" ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {reminder.remainingInstallments} de {reminder.totalInstallments}{" "}
                            restantes
                          </span>
                          <Progress value={getReminderProgress(reminder)} />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Recorrente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ReminderStatusBadge status={reminder.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(reminder.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          disabled={reminder.status !== "Ativo"}
                          onClick={() => onMarkReceived(reminder)}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle2Icon data-icon="inline-start" />
                          Recebido
                        </Button>
                        <TableActions
                          onDelete={() => onDelete(reminder)}
                          onEdit={() => onEdit(reminder)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={7}>
                    Nenhum lembrete cadastrado. Use esta área para cobrar valores sem lançar
                    receita.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
        <PaginationControls
          currentPage={currentPage}
          itemLabel="lembretes"
          onPageChange={setPage}
          pageCount={pageCount}
          totalItems={orderedReminders.length}
        />
      </CardContent>
    </Card>
  )
}
