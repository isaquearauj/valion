"use client"

import { PlusIcon } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { ChargeReminder, Income } from "@/features/finance/domain/types"
import { RemindersCard } from "@/features/finance/ui/sections/reminders-card"
import {
  MetricCard,
  PaginationControls,
  ResponsiveTable,
  SectionHeader,
  TABLE_PAGE_SIZE,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const incomeActionClassName =
  "border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"

export function IncomesSection({
  incomes,
  onAdd,
  onAddReminder,
  onDelete,
  onDeleteReminder,
  onEdit,
  onEditReminder,
  onMarkReminderReceived,
  reminders,
  summary,
}: {
  incomes: Income[]
  onAdd: () => void
  onAddReminder: () => void
  onDelete: (income: Income) => Promise<void> | void
  onDeleteReminder: (reminder: ChargeReminder) => void
  onEdit: (income: Income) => void
  onEditReminder: (reminder: ChargeReminder) => void
  onMarkReminderReceived: (reminder: ChargeReminder) => Promise<void> | void
  reminders: ChargeReminder[]
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(Math.ceil(incomes.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedIncomes = useMemo(
    () => incomes.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, incomes],
  )

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Cadastre salário, freelance, pensão, renda extra, mesada ou outras entradas."
        title="Controle de receitas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Receita mensal" value={formatCurrency(summary.monthlyIncome)} />
        <MetricCard label="Total comprometido" value={formatCurrency(summary.fixedExpenses)} />
        <MetricCard label="Orçamento livre" value={formatCurrency(summary.budgetAvailable)} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Receitas cadastradas</CardTitle>
            <CardDescription>
              Valores semanais e quinzenais são normalizados para o mês.
            </CardDescription>
          </div>
          <CardAction>
            <Button className={cn("min-w-[9.5rem]", incomeActionClassName)} onClick={onAdd}>
              <PlusIcon data-icon="inline-start" />
              Nova receita
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>
                      <div className="font-medium">{income.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {income.notes || "Sem observações"}
                      </div>
                    </TableCell>
                    <TableCell>{income.type}</TableCell>
                    <TableCell>{income.frequency}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(income.amount)}
                    </TableCell>
                    <TableCell>
                      <TableActions
                        onDelete={() => onDelete(income)}
                        onEdit={() => onEdit(income)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
          <PaginationControls
            currentPage={currentPage}
            itemLabel="receitas"
            onPageChange={setPage}
            pageCount={pageCount}
            totalItems={incomes.length}
          />
        </CardContent>
      </Card>

      <RemindersCard
        onAdd={onAddReminder}
        onDelete={onDeleteReminder}
        onEdit={onEditReminder}
        onMarkReceived={onMarkReminderReceived}
        reminders={reminders}
      />
    </div>
  )
}
