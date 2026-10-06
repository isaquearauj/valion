"use client"

import { BanknoteArrowUpIcon, WalletIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import {
  type ChargeReminder,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  type Income,
  type IncomeFrequency,
  type IncomeType,
} from "@/features/finance/domain/types"
import { RemindersCard } from "@/features/finance/ui/sections/reminders-card"
import {
  type ActiveCollectionFilter,
  CollectionCardHeader,
  CollectionEmpty,
  type CollectionFilterOption,
  CollectionFilterSelect,
  CollectionToolbar,
  MetricCard,
  ResponsiveTable,
  SectionHeader,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency } from "@/lib/formatters"

type IncomeTypeFilter = IncomeType | "all"
type IncomeFrequencyFilter = IncomeFrequency | "all"

const incomeTypeFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  ...INCOME_TYPES.map((value) => ({ label: value, value })),
]
const incomeFrequencyFilterOptions: CollectionFilterOption[] = [
  { label: "Todas", value: "all" },
  ...INCOME_FREQUENCIES.map((value) => ({ label: value, value })),
]

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
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<IncomeTypeFilter>("all")
  const [frequencyFilter, setFrequencyFilter] = useState<IncomeFrequencyFilter>("all")
  const filteredIncomes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")

    return incomes.filter((income) => {
      const matchesQuery = `${income.name} ${income.type}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)

      return (
        matchesQuery &&
        (typeFilter === "all" || income.type === typeFilter) &&
        (frequencyFilter === "all" || income.frequency === frequencyFilter)
      )
    })
  }, [frequencyFilter, incomes, query, typeFilter])
  const activeFilters: ActiveCollectionFilter[] = []
  if (typeFilter !== "all") {
    activeFilters.push({
      key: "type",
      label: `Tipo: ${typeFilter}`,
      onRemove: () => setTypeFilter("all"),
    })
  }
  if (frequencyFilter !== "all") {
    activeFilters.push({
      key: "frequency",
      label: `Frequência: ${frequencyFilter}`,
      onRemove: () => setFrequencyFilter("all"),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Cadastre salário, freelance, pensão, renda extra, mesada ou outras entradas."
        title="Controle de receitas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint={`${incomes.length} fonte(s) cadastrada(s)`}
          icon={BanknoteArrowUpIcon}
          label="Receita mensal"
          tone="income"
          value={formatCurrency(summary.monthlyIncome)}
        />
        <MetricCard
          label="Total comprometido"
          tone="expense"
          value={formatCurrency(summary.fixedExpenses)}
        />
        <MetricCard
          icon={WalletIcon}
          label="Orçamento livre"
          value={formatCurrency(summary.budgetAvailable)}
        />
      </div>

      <Card>
        <CollectionCardHeader
          actionLabel="Nova receita"
          description="Valores semanais e quinzenais são normalizados para o mês."
          onAction={onAdd}
          title="Receitas cadastradas"
        />
        <CardContent className="space-y-4">
          <CollectionToolbar
            activeFilters={activeFilters}
            itemLabel="receitas"
            onClearFilters={() => {
              setQuery("")
              setTypeFilter("all")
              setFrequencyFilter("all")
            }}
            onQueryChange={setQuery}
            query={query}
            searchLabel="Buscar receitas"
            totalItems={incomes.length}
            visibleItems={filteredIncomes.length}
          >
            <CollectionFilterSelect
              label="Categoria"
              onChange={(value) => setTypeFilter(value as IncomeTypeFilter)}
              options={incomeTypeFilterOptions}
              value={typeFilter}
            />
            <CollectionFilterSelect
              label="Frequência"
              onChange={(value) => setFrequencyFilter(value as IncomeFrequencyFilter)}
              options={incomeFrequencyFilterOptions}
              value={frequencyFilter}
            />
          </CollectionToolbar>
          {filteredIncomes.length ? (
            <>
              <ResponsiveTable desktopOnly>
                <Table containerClassName="max-h-[28rem] overflow-auto">
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
                    {filteredIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>
                          <div className="font-medium">{income.name}</div>
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
              <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1 md:hidden">
                {filteredIncomes.map((income) => (
                  <article
                    className="rounded-xl border border-border bg-background p-4"
                    key={income.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{income.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {income.type} · {income.frequency}
                        </p>
                      </div>
                      <p className="shrink-0 font-heading font-bold tabular-nums text-finance-income">
                        {formatCurrency(income.amount)}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-border/70 pt-2">
                      <TableActions
                        onDelete={() => onDelete(income)}
                        onEdit={() => onEdit(income)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <CollectionEmpty
              description={
                incomes.length
                  ? "Tente outro nome ou categoria."
                  : "Cadastre sua primeira entrada para acompanhar o orçamento com clareza."
              }
              title={incomes.length ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada"}
            />
          )}
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
