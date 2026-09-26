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
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import { getInstallmentProgress } from "@/features/finance/domain/calculations"
import type { FixedExpense } from "@/features/finance/domain/types"
import {
  ExpenseStatusBadge,
  MetricCard,
  PaginationControls,
  ResponsiveTable,
  SectionHeader,
  TABLE_PAGE_SIZE,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDueDay, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const expenseActionClassName =
  "border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-500/30 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"

export function ExpensesSection({
  expenses,
  onAdd,
  onDelete,
  onEdit,
  summary,
}: {
  expenses: FixedExpense[]
  onAdd: () => void
  onDelete: (expense: FixedExpense) => Promise<void> | void
  onEdit: (expense: FixedExpense) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(Math.ceil(expenses.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedExpenses = useMemo(
    () => expenses.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, expenses],
  )

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Controle contas fixas, assinaturas, parcelamentos, empréstimos e financiamentos."
        title="Controle de despesas fixas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total comprometido" value={formatCurrency(summary.fixedExpenses)} />
        <MetricCard label="Renda comprometida" value={formatPercent(summary.committedPercent)} />
        <MetricCard label="Parcelas restantes" value={String(summary.debtInstallmentsRemaining)} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Compromissos recorrentes</CardTitle>
            <CardDescription>
              Despesas fixas cadastradas para acompanhar recorrência, vencimentos e status.
            </CardDescription>
          </div>
          <CardAction>
            <Button className={cn("min-w-[9.5rem]", expenseActionClassName)} onClick={onAdd}>
              <PlusIcon data-icon="inline-start" />
              Nova despesa
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Despesa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="font-medium">{expense.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {expense.notes || "Sem observações"}
                      </div>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatDueDay(expense.dueDay)}</TableCell>
                    <TableCell className="min-w-36">
                      {expense.totalInstallments > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {expense.remainingInstallments} de {expense.totalInstallments} restantes
                          </span>
                          <Progress value={getInstallmentProgress(expense)} />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Recorrente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ExpenseStatusBadge status={expense.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(expense.monthlyAmount)}
                    </TableCell>
                    <TableCell>
                      <TableActions
                        onDelete={() => onDelete(expense)}
                        onEdit={() => onEdit(expense)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
          <PaginationControls
            currentPage={currentPage}
            itemLabel="despesas"
            onPageChange={setPage}
            pageCount={pageCount}
            totalItems={expenses.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}
