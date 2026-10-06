"use client"

import { CreditCardIcon, ListChecksIcon, PieChartIcon } from "lucide-react"
import { useMemo, useState } from "react"

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
import type { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import { getInstallmentProgress } from "@/features/finance/domain/calculations"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  type ExpenseCategory,
  type ExpenseStatus,
  type FixedExpense,
} from "@/features/finance/domain/types"
import {
  type ActiveCollectionFilter,
  CollectionCardHeader,
  CollectionEmpty,
  type CollectionFilterOption,
  CollectionFilterSelect,
  CollectionToolbar,
  ExpenseStatusBadge,
  MetricCard,
  ResponsiveTable,
  SectionHeader,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDueDay, formatPercent } from "@/lib/formatters"

type ExpenseCategoryFilter = ExpenseCategory | "all"
type ExpenseStatusFilter = ExpenseStatus | "all"
type ExpenseInstallmentFilter = "all" | "installment" | "recurring"
type ExpenseDueDayFilter = "all" | "early" | "middle" | "late"

const expenseCategoryFilterOptions: CollectionFilterOption[] = [
  { label: "Todas", value: "all" },
  ...EXPENSE_CATEGORIES.map((value) => ({ label: value, value })),
]
const expenseStatusFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  ...EXPENSE_STATUSES.map((value) => ({ label: value, value })),
]
const expenseInstallmentFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Recorrentes", value: "recurring" },
  { label: "Parceladas", value: "installment" },
]
const expenseDueDayFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Dias 1–10", value: "early" },
  { label: "Dias 11–20", value: "middle" },
  { label: "Dias 21–31", value: "late" },
]

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
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategoryFilter>("all")
  const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>("Ativa")
  const [installmentFilter, setInstallmentFilter] = useState<ExpenseInstallmentFilter>("all")
  const [dueDayFilter, setDueDayFilter] = useState<ExpenseDueDayFilter>("all")
  const filteredExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")

    return expenses.filter((expense) => {
      const matchesQuery = `${expense.name} ${expense.category} ${expense.status}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
      const matchesInstallmentType =
        installmentFilter === "all" ||
        (installmentFilter === "installment"
          ? expense.totalInstallments > 0
          : expense.totalInstallments === 0)
      const matchesDueDay =
        dueDayFilter === "all" ||
        (dueDayFilter === "early" && expense.dueDay <= 10) ||
        (dueDayFilter === "middle" && expense.dueDay > 10 && expense.dueDay <= 20) ||
        (dueDayFilter === "late" && expense.dueDay > 20)

      return (
        matchesQuery &&
        (categoryFilter === "all" || expense.category === categoryFilter) &&
        (statusFilter === "all" || expense.status === statusFilter) &&
        matchesInstallmentType &&
        matchesDueDay
      )
    })
  }, [categoryFilter, dueDayFilter, expenses, installmentFilter, query, statusFilter])
  const activeFilters: ActiveCollectionFilter[] = []
  if (categoryFilter !== "all") {
    activeFilters.push({
      key: "category",
      label: `Categoria: ${categoryFilter}`,
      onRemove: () => setCategoryFilter("all"),
    })
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter}`,
      onRemove: () => setStatusFilter("all"),
    })
  }
  if (installmentFilter !== "all") {
    activeFilters.push({
      key: "installments",
      label: installmentFilter === "installment" ? "Parceladas" : "Recorrentes",
      onRemove: () => setInstallmentFilter("all"),
    })
  }
  if (dueDayFilter !== "all") {
    activeFilters.push({
      key: "due-day",
      label:
        dueDayFilter === "early"
          ? "Vencimento: dias 1–10"
          : dueDayFilter === "middle"
            ? "Vencimento: dias 11–20"
            : "Vencimento: dias 21–31",
      onRemove: () => setDueDayFilter("all"),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Acompanhe contas recorrentes, assinaturas e compras parceladas em um só lugar."
        title="Controle de despesas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint={`${summary.activeExpensesCount} compromisso(s) ativo(s)`}
          icon={CreditCardIcon}
          label="Total comprometido"
          tone="expense"
          value={formatCurrency(summary.fixedExpenses)}
        />
        <MetricCard
          icon={PieChartIcon}
          label="Renda comprometida"
          tone="expense"
          value={formatPercent(summary.committedPercent)}
        />
        <MetricCard
          icon={ListChecksIcon}
          label="Parcelas restantes"
          value={String(summary.debtInstallmentsRemaining)}
        />
      </div>

      <Card>
        <CollectionCardHeader
          actionLabel="Nova despesa"
          description="Despesas cadastradas para acompanhar recorrência, vencimentos e prazos."
          onAction={onAdd}
          title="Despesas cadastradas"
          tone="expense"
        />
        <CardContent className="space-y-4">
          <CollectionToolbar
            activeFilters={activeFilters}
            itemLabel="despesas"
            onClearFilters={() => {
              setQuery("")
              setCategoryFilter("all")
              setStatusFilter("all")
              setInstallmentFilter("all")
              setDueDayFilter("all")
            }}
            onQueryChange={setQuery}
            query={query}
            searchLabel="Buscar despesas"
            totalItems={expenses.length}
            visibleItems={filteredExpenses.length}
          >
            <CollectionFilterSelect
              label="Categoria"
              onChange={(value) => setCategoryFilter(value as ExpenseCategoryFilter)}
              options={expenseCategoryFilterOptions}
              value={categoryFilter}
            />
            <CollectionFilterSelect
              label="Status"
              onChange={(value) => setStatusFilter(value as ExpenseStatusFilter)}
              options={expenseStatusFilterOptions}
              value={statusFilter}
            />
            <CollectionFilterSelect
              label="Tipo"
              onChange={(value) => setInstallmentFilter(value as ExpenseInstallmentFilter)}
              options={expenseInstallmentFilterOptions}
              value={installmentFilter}
            />
            <CollectionFilterSelect
              label="Vencimento"
              onChange={(value) => setDueDayFilter(value as ExpenseDueDayFilter)}
              options={expenseDueDayFilterOptions}
              value={dueDayFilter}
            />
          </CollectionToolbar>
          {filteredExpenses.length ? (
            <>
              <ResponsiveTable desktopOnly>
                <Table containerClassName="max-h-[28rem] overflow-auto">
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
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="font-medium">{expense.name}</div>
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{formatDueDay(expense.dueDay)}</TableCell>
                        <TableCell className="min-w-36">
                          {expense.totalInstallments > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {expense.remainingInstallments} de {expense.totalInstallments}{" "}
                                restantes
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
              <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1 md:hidden">
                {filteredExpenses.map((expense) => (
                  <article
                    className="rounded-xl border border-border bg-background p-4"
                    key={expense.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{expense.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {expense.category} · vence {formatDueDay(expense.dueDay)}
                        </p>
                      </div>
                      <p className="shrink-0 font-heading font-bold tabular-nums text-finance-expense">
                        {formatCurrency(expense.monthlyAmount)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <ExpenseStatusBadge status={expense.status} />
                      <span className="text-xs text-muted-foreground">
                        {expense.totalInstallments > 0
                          ? `${expense.remainingInstallments} de ${expense.totalInstallments} parcelas`
                          : "Recorrente"}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-border/70 pt-2">
                      <TableActions
                        onDelete={() => onDelete(expense)}
                        onEdit={() => onEdit(expense)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <CollectionEmpty
              description={
                expenses.length
                  ? "Tente outro nome, categoria ou status."
                  : "Cadastre seu primeiro compromisso para acompanhar o orçamento mensal."
              }
              title={expenses.length ? "Nenhuma despesa encontrada" : "Nenhuma despesa cadastrada"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
