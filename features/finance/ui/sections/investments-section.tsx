"use client"

import { ChartNoAxesCombinedIcon, PercentIcon, PiggyBankIcon } from "lucide-react"
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
import type { InvestmentEntry } from "@/features/finance/domain/types"
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
import { formatCurrency, formatMonth, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type InvestmentPerformanceFilter = "all" | "above" | "exact" | "below"

const performanceFilterOptions: CollectionFilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Acima da meta", value: "above" },
  { label: "Na meta", value: "exact" },
  { label: "Abaixo da meta", value: "below" },
]

export function InvestmentsSection({
  investments,
  onAdd,
  onDelete,
  onEdit,
  summary,
}: {
  investments: InvestmentEntry[]
  onAdd: () => void
  onDelete: (investment: InvestmentEntry) => Promise<void> | void
  onEdit: (investment: InvestmentEntry) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const [query, setQuery] = useState("")
  const [performanceFilter, setPerformanceFilter] = useState<InvestmentPerformanceFilter>("all")
  const [yearFilter, setYearFilter] = useState("all")

  const totalInvested = useMemo(
    () => investments.reduce((sum, item) => sum + item.investedAmount, 0),
    [investments],
  )
  const totalAportesCount = useMemo(
    () => investments.filter((item) => item.investedAmount > 0).length,
    [investments],
  )
  const monthGoalPercent =
    summary.plannedInvestment > 0
      ? Math.round((summary.investedAmount / summary.plannedInvestment) * 100)
      : null
  const savingsRate =
    summary.monthlyIncome > 0 ? (summary.investedAmount / summary.monthlyIncome) * 100 : 0

  const yearFilterOptions = useMemo<CollectionFilterOption[]>(() => {
    const years = Array.from(new Set(investments.map((entry) => entry.month.slice(0, 4)))).sort(
      (a, b) => b.localeCompare(a),
    )

    return [
      { label: "Todos os anos", value: "all" },
      ...years.map((year) => ({ label: year, value: year })),
    ]
  }, [investments])

  const filteredInvestments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")

    return investments.filter((investment) => {
      const monthText = formatMonth(investment.month).toLocaleLowerCase("pt-BR")
      const notesText = (investment.notes || "").toLocaleLowerCase("pt-BR")
      const rawMonth = investment.month.toLocaleLowerCase("pt-BR")
      const matchesQuery =
        monthText.includes(normalizedQuery) ||
        notesText.includes(normalizedQuery) ||
        rawMonth.includes(normalizedQuery)

      const delta = investment.investedAmount - investment.plannedAmount
      const matchesPerformance =
        performanceFilter === "all" ||
        (performanceFilter === "above" && delta > 0) ||
        (performanceFilter === "exact" && delta === 0 && investment.plannedAmount > 0) ||
        (performanceFilter === "below" && delta < 0)

      const year = investment.month.slice(0, 4)
      const matchesYear = yearFilter === "all" || year === yearFilter

      return matchesQuery && matchesPerformance && matchesYear
    })
  }, [investments, performanceFilter, query, yearFilter])

  const activeFilters: ActiveCollectionFilter[] = []
  if (performanceFilter !== "all") {
    const performanceLabels: Record<InvestmentPerformanceFilter, string> = {
      all: "Todos",
      above: "Acima da meta",
      exact: "Na meta",
      below: "Abaixo da meta",
    }
    activeFilters.push({
      key: "performance",
      label: `Desempenho: ${performanceLabels[performanceFilter]}`,
      onRemove: () => setPerformanceFilter("all"),
    })
  }
  if (yearFilter !== "all") {
    activeFilters.push({
      key: "year",
      label: `Ano: ${yearFilter}`,
      onRemove: () => setYearFilter("all"),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Defina o planejado, registre o realizado e compare a evolução mensal."
        title="Controle de investimentos"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint={`${totalAportesCount} ${totalAportesCount === 1 ? "aporte realizado" : "aportes realizados"}`}
          icon={PiggyBankIcon}
          label="Total aportado"
          tone="income"
          value={formatCurrency(totalInvested)}
        />
        <MetricCard
          hint={monthGoalPercent !== null ? `${monthGoalPercent}% da meta` : "Sem meta definida"}
          icon={ChartNoAxesCombinedIcon}
          label="Aporte do mês"
          tone="info"
          value={formatCurrency(summary.investedAmount)}
        />
        <MetricCard
          hint="Da receita mensal"
          icon={PercentIcon}
          label="Taxa de aporte"
          value={formatPercent(savingsRate)}
        />
      </div>

      <Card>
        <CollectionCardHeader
          actionLabel="Registrar aporte"
          description="Use o mês atual para calcular o orçamento após investimentos."
          onAction={onAdd}
          title="Histórico mensal de investimentos"
        />
        <CardContent className="space-y-4">
          <CollectionToolbar
            activeFilters={activeFilters}
            itemLabel="investimentos"
            onClearFilters={() => {
              setQuery("")
              setPerformanceFilter("all")
              setYearFilter("all")
            }}
            onQueryChange={setQuery}
            query={query}
            searchLabel="Buscar mês ou anotações"
            totalItems={investments.length}
            visibleItems={filteredInvestments.length}
          >
            <CollectionFilterSelect
              label="Desempenho"
              onChange={(value) => setPerformanceFilter(value as InvestmentPerformanceFilter)}
              options={performanceFilterOptions}
              value={performanceFilter}
            />
            {yearFilterOptions.length > 2 ? (
              <CollectionFilterSelect
                label="Ano"
                onChange={setYearFilter}
                options={yearFilterOptions}
                value={yearFilter}
              />
            ) : null}
          </CollectionToolbar>

          {filteredInvestments.length ? (
            <>
              <ResponsiveTable desktopOnly>
                <Table containerClassName="max-h-[28rem] overflow-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Planejado</TableHead>
                      <TableHead className="text-right">Realizado</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.map((investment) => {
                      const delta = investment.investedAmount - investment.plannedAmount

                      return (
                        <TableRow key={investment.id}>
                          <TableCell>
                            <div className="font-medium">{formatMonth(investment.month)}</div>
                            {investment.notes ? (
                              <div className="max-w-xs truncate text-xs text-muted-foreground">
                                {investment.notes}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(investment.plannedAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(investment.investedAmount)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono tabular-nums font-medium",
                              delta > 0 && "text-finance-income",
                              delta < 0 && "text-finance-expense",
                              delta === 0 && "text-muted-foreground",
                            )}
                          >
                            {delta > 0 ? `+${formatCurrency(delta)}` : formatCurrency(delta)}
                          </TableCell>
                          <TableCell className="text-right">
                            <TableActions
                              onDelete={() => onDelete(investment)}
                              onEdit={() => onEdit(investment)}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>
              <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1 md:hidden">
                {filteredInvestments.map((investment) => {
                  const delta = investment.investedAmount - investment.plannedAmount

                  return (
                    <article
                      className="rounded-xl border border-border bg-background p-4"
                      key={investment.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{formatMonth(investment.month)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Planejado: {formatCurrency(investment.plannedAmount)}
                          </p>
                        </div>
                        <p className="shrink-0 font-heading font-bold tabular-nums text-finance-info">
                          {formatCurrency(investment.investedAmount)}
                        </p>
                      </div>
                      {investment.notes ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {investment.notes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
                        <span
                          className={cn(
                            "text-xs font-mono font-medium tabular-nums",
                            delta > 0 && "text-finance-income",
                            delta < 0 && "text-finance-expense",
                            delta === 0 && "text-muted-foreground",
                          )}
                        >
                          Diferença:{" "}
                          {delta > 0 ? `+${formatCurrency(delta)}` : formatCurrency(delta)}
                        </span>
                        <TableActions
                          onDelete={() => onDelete(investment)}
                          onEdit={() => onEdit(investment)}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          ) : (
            <CollectionEmpty
              description={
                investments.length
                  ? "Tente buscar por outro mês, ano ou filtro de desempenho."
                  : "Registre o primeiro mês para comparar o planejado com o realizado."
              }
              title={
                investments.length ? "Nenhum mês encontrado" : "Nenhum investimento registrado"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
