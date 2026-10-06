"use client"

import { CheckCircle2Icon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  type ChargeReminder,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderStatus,
  type ReminderType,
} from "@/features/finance/domain/types"
import {
  getReminderProgress,
  getReminderStatusPriority,
  isReminderDue,
} from "@/features/finance/presentation/dashboard-view-models"
import {
  type ActiveCollectionFilter,
  CollectionCardHeader,
  CollectionEmpty,
  type CollectionFilterOption,
  CollectionFilterSelect,
  CollectionToolbar,
  ReminderStatusBadge,
  ReminderTypeBadge,
  ResponsiveTable,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDateKey } from "@/lib/formatters"

type ReminderTypeFilter = ReminderType | "all"
type ReminderStatusFilter = ReminderStatus | "all"
type ReminderDueFilter = "all" | "overdue" | "upcoming"

const reminderTypeFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  ...REMINDER_TYPES.map((value) => ({ label: value, value })),
]
const reminderStatusFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  ...REMINDER_STATUSES.map((value) => ({ label: value, value })),
]
const reminderDueFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Atrasados", value: "overdue" },
  { label: "A vencer", value: "upcoming" },
]

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
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ReminderTypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>("all")
  const [dueFilter, setDueFilter] = useState<ReminderDueFilter>("all")
  const today = getCurrentDateKey()
  const orderedReminders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")
    return reminders
      .filter((reminder) => {
        const matchesQuery =
          `${reminder.name} ${reminder.person} ${reminder.status} ${reminder.type} ${reminder.frequency} ${reminder.notes}`
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedQuery)
        const matchesDueFilter =
          dueFilter === "all" ||
          (dueFilter === "overdue" && isReminderDue(reminder, today)) ||
          (dueFilter === "upcoming" &&
            reminder.status === "Ativo" &&
            !isReminderDue(reminder, today))

        return (
          matchesQuery &&
          (typeFilter === "all" || reminder.type === typeFilter) &&
          (statusFilter === "all" || reminder.status === statusFilter) &&
          matchesDueFilter
        )
      })
      .toSorted((a, b) => {
        const statusDelta = getReminderStatusPriority(a) - getReminderStatusPriority(b)

        if (statusDelta !== 0) {
          return statusDelta
        }

        return a.nextDueDate.localeCompare(b.nextDueDate)
      })
  }, [dueFilter, query, reminders, statusFilter, today, typeFilter])
  const activeFilters: ActiveCollectionFilter[] = []
  if (typeFilter !== "all") {
    activeFilters.push({
      key: "type",
      label: `Tipo: ${typeFilter}`,
      onRemove: () => setTypeFilter("all"),
    })
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter}`,
      onRemove: () => setStatusFilter("all"),
    })
  }
  if (dueFilter !== "all") {
    activeFilters.push({
      key: "due",
      label: dueFilter === "overdue" ? "Atrasados" : "A vencer",
      onRemove: () => setDueFilter("all"),
    })
  }

  return (
    <Card>
      <CollectionCardHeader
        actionLabel="Novo lembrete"
        description="Controle cobranças recorrentes ou parceladas sem interferir nas receitas da Visão Geral."
        onAction={onAdd}
        title="Lembretes"
      />
      <CardContent className="space-y-4">
        <CollectionToolbar
          activeFilters={activeFilters}
          itemLabel="lembretes"
          onClearFilters={() => {
            setQuery("")
            setTypeFilter("all")
            setStatusFilter("all")
            setDueFilter("all")
          }}
          onQueryChange={setQuery}
          query={query}
          searchLabel="Buscar lembretes"
          totalItems={reminders.length}
          visibleItems={orderedReminders.length}
        >
          <CollectionFilterSelect
            label="Tipo do lembrete"
            onChange={(value) => setTypeFilter(value as ReminderTypeFilter)}
            options={reminderTypeFilterOptions}
            value={typeFilter}
          />
          <CollectionFilterSelect
            label="Status"
            onChange={(value) => setStatusFilter(value as ReminderStatusFilter)}
            options={reminderStatusFilterOptions}
            value={statusFilter}
          />
          <CollectionFilterSelect
            label="Vencimento"
            onChange={(value) => setDueFilter(value as ReminderDueFilter)}
            options={reminderDueFilterOptions}
            value={dueFilter}
          />
        </CollectionToolbar>
        {orderedReminders.length ? (
          <>
            <ResponsiveTable desktopOnly>
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
                  {orderedReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div className="font-medium">{reminder.name}</div>
                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                          {reminder.notes
                            ? `${reminder.person} · ${reminder.notes}`
                            : reminder.person}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <ReminderTypeBadge type={reminder.type} />
                          <span className="text-xs text-muted-foreground">
                            {reminder.frequency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{formatDateKey(reminder.nextDueDate)}</span>
                          {isReminderDue(reminder, today) ? (
                            <span className="text-xs font-medium text-destructive">
                              Cobrar agora
                            </span>
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
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
            <div className="flex flex-col gap-3 md:hidden">
              {orderedReminders.map((reminder) => (
                <article
                  className="rounded-xl border border-border bg-background p-4"
                  key={reminder.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{reminder.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {reminder.person} · {reminder.type}
                      </p>
                    </div>
                    <p className="shrink-0 font-heading font-bold tabular-nums">
                      {formatCurrency(reminder.amount)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <ReminderStatusBadge status={reminder.status} />
                    <span className="text-xs text-muted-foreground">
                      Próxima: {formatDateKey(reminder.nextDueDate)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-2">
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
                </article>
              ))}
            </div>
          </>
        ) : (
          <CollectionEmpty
            description={
              reminders.length
                ? "Tente buscar por outro nome, pessoa ou status."
                : "Organize cobranças sem misturá-las com as receitas recebidas."
            }
            title={reminders.length ? "Nenhum lembrete encontrado" : "Nenhum lembrete cadastrado"}
          />
        )}
      </CardContent>
    </Card>
  )
}
