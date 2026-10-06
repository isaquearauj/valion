"use client"

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PieChartIcon,
  RotateCcwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"
import { useId, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppTooltip } from "@/components/ui/tooltip"
import type { getMonthlyHistory } from "@/features/finance/domain/calculations"
import { formatShortCurrency } from "@/features/finance/presentation/dashboard-view-models"
import {
  distributionChartConfig,
  historyChartConfig,
} from "@/features/finance/ui/dashboard/chart-config"
import { CurrencyTooltip } from "@/features/finance/ui/dashboard/overview-section"
import { ChartLegendItem, TrendDelta } from "@/features/finance/ui/sections/section-helpers"
import {
  type ActiveCollectionFilter,
  CollectionEmpty,
  type CollectionFilterOption,
  CollectionFilterSelect,
  CollectionToolbar,
  ResponsiveTable,
  SectionHeader,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatMonth, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type ChartRange = "6m" | "12m" | "all"

export function HistorySection({ history }: { history: ReturnType<typeof getMonthlyHistory> }) {
  const monthSelectId = useId()
  const [query, setQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [chartRange, setChartRange] = useState<ChartRange>("all")

  // Ordenação cronológica crescente de todo o histórico
  const orderedHistory = useMemo(
    () => history.toSorted((a, b) => a.month.localeCompare(b.month)),
    [history],
  )
  const latestMonth = orderedHistory.at(-1)?.month ?? ""

  // Estado do mês selecionado para referência
  const [selectedMonthKey, setSelectedMonthKey] = useState(latestMonth)

  // Enriquecimento analítico de todos os meses disponíveis
  const historyAnalysis = useMemo(
    () =>
      orderedHistory.map((item) => {
        const budgetAvailable = item.income - item.expenses
        const budgetRemainingAfterInvestment = budgetAvailable - item.plannedInvestment
        const committed = item.income > 0 ? (item.expenses / item.income) * 100 : 0
        const investmentProgress =
          item.plannedInvestment > 0 ? (item.investedAmount / item.plannedInvestment) * 100 : 0

        return {
          ...item,
          budgetAvailable,
          budgetRemainingAfterInvestment,
          committed,
          investmentProgress,
          label: formatMonth(item.month),
        }
      }),
    [orderedHistory],
  )

  // Se o mês selecionado não estiver na lista de histórico, volta para o mais recente
  const referenceMonthKey = historyAnalysis.some((item) => item.month === selectedMonthKey)
    ? selectedMonthKey
    : latestMonth

  const selectedIndex = historyAnalysis.findIndex((item) => item.month === referenceMonthKey)
  const selectedMonth = historyAnalysis[selectedIndex]
  const previousMonth = selectedIndex > 0 ? historyAnalysis[selectedIndex - 1] : null
  const hasMovement = historyAnalysis.some(
    (item) => item.income || item.expenses || item.plannedInvestment || item.investedAmount,
  )

  // Navegação sequencial entre meses
  const canGoPrevious = selectedIndex > 0
  const canGoNext = selectedIndex < historyAnalysis.length - 1

  const handlePreviousMonth = () => {
    if (canGoPrevious) {
      setSelectedMonthKey(historyAnalysis[selectedIndex - 1].month)
    }
  }

  const handleNextMonth = () => {
    if (canGoNext) {
      setSelectedMonthKey(historyAnalysis[selectedIndex + 1].month)
    }
  }

  const handleResetToLatest = () => {
    setSelectedMonthKey(latestMonth)
  }

  // Lista de todos os meses ordenados do mais recente para o mais antigo (para dropdown e tabela)
  const allMonthsReversed = useMemo(
    () => historyAnalysis.toSorted((a, b) => b.month.localeCompare(a.month)),
    [historyAnalysis],
  )

  // Meses agrupados por ano para uma UX refinada no Select quando houver muitos registros
  const monthsByYear = useMemo(() => {
    const groups = new Map<string, typeof historyAnalysis>()
    for (const item of allMonthsReversed) {
      const year = item.month.slice(0, 4)
      const list = groups.get(year) ?? []
      list.push(item)
      groups.set(year, list)
    }
    return Array.from(groups.entries())
  }, [allMonthsReversed])

  // Anos disponíveis para filtro na tabela
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(historyAnalysis.map((item) => item.month.slice(0, 4)))).sort(
      (a, b) => b.localeCompare(a),
    )
    return [
      { label: "Todos os anos", value: "all" },
      ...years.map((y) => ({ label: y, value: y })),
    ] satisfies CollectionFilterOption[]
  }, [historyAnalysis])

  // Dados filtrados do gráfico de evolução conforme amplitude selecionada
  const chartData = useMemo(() => {
    if (chartRange === "6m") return historyAnalysis.slice(-6)
    if (chartRange === "12m") return historyAnalysis.slice(-12)
    return historyAnalysis
  }, [chartRange, historyAnalysis])

  // Dados da tabela com busca e filtro por ano
  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")

    return allMonthsReversed.filter((item) => {
      const label = item.label.toLocaleLowerCase("pt-BR")
      const rawMonth = item.month.toLocaleLowerCase("pt-BR")
      const matchesQuery =
        !normalizedQuery || label.includes(normalizedQuery) || rawMonth.includes(normalizedQuery)
      const matchesYear = yearFilter === "all" || item.month.startsWith(yearFilter)

      return matchesQuery && matchesYear
    })
  }, [allMonthsReversed, query, yearFilter])

  const activeFilters: ActiveCollectionFilter[] = []
  if (yearFilter !== "all") {
    activeFilters.push({
      key: "year",
      label: `Ano: ${yearFilter}`,
      onRemove: () => setYearFilter("all"),
    })
  }

  if (!selectedMonth || !hasMovement) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHeader
          description="Acompanhe a evolução de receitas, despesas, investimentos e orçamento livre."
          title="Histórico financeiro"
        />
        <CollectionEmpty
          description="Os primeiros meses aparecem aqui assim que houver movimentações financeiras."
          title="Ainda não há histórico para analisar"
        />
      </div>
    )
  }

  const comparisonCards = [
    {
      delta: selectedMonth.income - (previousMonth?.income ?? selectedMonth.income),
      hint: previousMonth ? `vs ${formatMonth(previousMonth.month)}` : "Primeiro registro",
      icon: TrendingUpIcon,
      inverse: false,
      kind: "currency" as const,
      label: "Receitas",
      tone: "income" as const,
      value: formatCurrency(selectedMonth.income),
    },
    {
      delta: selectedMonth.expenses - (previousMonth?.expenses ?? selectedMonth.expenses),
      hint: previousMonth ? `vs ${formatMonth(previousMonth.month)}` : "Primeiro registro",
      icon: TrendingDownIcon,
      inverse: true,
      kind: "currency" as const,
      label: "Despesas",
      tone: "expense" as const,
      value: formatCurrency(selectedMonth.expenses),
    },
    {
      delta:
        selectedMonth.budgetAvailable -
        (previousMonth?.budgetAvailable ?? selectedMonth.budgetAvailable),
      hint: previousMonth ? `vs ${formatMonth(previousMonth.month)}` : "Primeiro registro",
      icon: WalletIcon,
      inverse: false,
      kind: "currency" as const,
      label: "Orçamento livre",
      tone: "info" as const,
      value: formatCurrency(selectedMonth.budgetAvailable),
    },
    {
      delta: selectedMonth.committed - (previousMonth?.committed ?? selectedMonth.committed),
      hint: previousMonth ? `vs ${formatMonth(previousMonth.month)}` : "Primeiro registro",
      icon: PieChartIcon,
      inverse: true,
      kind: "percent" as const,
      label: "Comprometido",
      tone: "neutral" as const,
      value: formatPercent(selectedMonth.committed),
    },
  ]

  const selectedMonthBreakdown = [
    { color: "var(--chart-1)", label: "Receitas", value: selectedMonth.income },
    { color: "var(--chart-2)", label: "Despesas", value: selectedMonth.expenses },
    {
      color: "var(--chart-4)",
      label: "Meta",
      value: selectedMonth.plannedInvestment,
    },
    { color: "var(--chart-3)", label: "Investido", value: selectedMonth.investedAmount },
  ]

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Escolha qualquer mês do seu histórico e compare evolução, orçamento livre, despesas e aportes ao longo do tempo."
        title="Histórico financeiro"
      />

      {/* Card Hero de Seleção do Mês de Referência */}
      <Card className="border-border/80 bg-card py-0 shadow-xs">
        <CardHeader className="px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="gap-1.5" variant="secondary">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  Mês de referência
                </Badge>
                {selectedMonth.month === latestMonth ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Mais recente
                  </Badge>
                ) : null}
              </div>
              <CardTitle className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {formatMonth(selectedMonth.month)}
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                Análise aprofundada comparada a{" "}
                {previousMonth ? formatMonth(previousMonth.month) : "mês anterior"} e todo o período
                registrado.
              </CardDescription>
            </div>

            {/* Controles de Navegação e Seletor Completo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-border/80 bg-background/50 p-1 shadow-2xs">
                <AppTooltip content="Mês anterior">
                  <Button
                    aria-label="Mês anterior"
                    disabled={!canGoPrevious}
                    onClick={handlePreviousMonth}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                </AppTooltip>

                {/* Dropdown com TODOS os meses organizados elegantemente por Ano */}
                <Select
                  onValueChange={(val) => {
                    if (val) setSelectedMonthKey(val)
                  }}
                  value={referenceMonthKey}
                >
                  <SelectTrigger
                    className="h-8 border-none bg-transparent px-3 font-medium text-foreground shadow-none hover:bg-muted/60"
                    id={monthSelectId}
                  >
                    <SelectValue>{formatMonth(selectedMonth.month)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    align="center"
                    alignItemWithTrigger={false}
                    className="w-48 max-h-72"
                  >
                    {monthsByYear.map(([year, monthsInYear], index) => (
                      <SelectGroup key={year}>
                        {monthsByYear.length > 1 ? (
                          <>
                            {index > 0 ? <SelectSeparator /> : null}
                            <SelectLabel className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              {year}
                            </SelectLabel>
                          </>
                        ) : null}
                        {monthsInYear.map((item) => (
                          <SelectItem
                            className="cursor-pointer pr-2.5 text-sm [&_[data-slot=select-item-indicator]]:hidden"
                            key={item.month}
                            value={item.month}
                          >
                            {formatMonth(item.month)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                <AppTooltip content="Próximo mês">
                  <Button
                    aria-label="Próximo mês"
                    disabled={!canGoNext}
                    onClick={handleNextMonth}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </AppTooltip>
              </div>

              {/* Botão de Atalho para o Mês Mais Recente */}
              {selectedMonth.month !== latestMonth ? (
                <AppTooltip content="Ir para o mês mais recente">
                  <Button
                    className="h-10 gap-1.5 px-3"
                    onClick={handleResetToLatest}
                    size="sm"
                    variant="outline"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    <span className="hidden sm:inline">Mês atual</span>
                  </Button>
                </AppTooltip>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de KPIs Padronizados */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {comparisonCards.map((card) => {
          const Icon = card.icon
          return (
            <Card className="min-w-0 border-border/80 py-4 shadow-xs" key={card.label}>
              <CardHeader className="flex flex-row items-center gap-3.5 pb-2">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary",
                    card.tone === "income" && "bg-finance-income-soft text-finance-income",
                    card.tone === "expense" && "bg-finance-expense-soft text-finance-expense",
                    card.tone === "info" && "bg-finance-info-soft text-finance-info",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <CardDescription className="text-xs font-medium">{card.label}</CardDescription>
                  <CardTitle
                    className={cn(
                      "mt-0.5 font-heading text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl",
                      card.tone === "income" && "text-finance-income",
                      card.tone === "expense" && "text-finance-expense",
                    )}
                  >
                    {card.value}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardFooter className="justify-between gap-2 border-t border-border/40 pt-3 text-xs">
                <span className="truncate text-muted-foreground">{card.hint}</span>
                <TrendDelta inverse={card.inverse} kind={card.kind} value={card.delta} />
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Tabela de Detalhamento Mensal Completo */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Detalhamento mensal completo</CardTitle>
            <CardDescription>
              Acesse e inspecione qualquer mês registrado. Clique em uma linha para defini-la como
              referência.
            </CardDescription>
          </div>
          <Badge className="w-fit text-xs" variant="secondary">
            {filteredHistory.length}{" "}
            {filteredHistory.length === 1 ? "mês registrado" : "meses registrados"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <CollectionToolbar
            activeFilters={activeFilters}
            itemLabel="meses"
            onClearFilters={() => {
              setQuery("")
              setYearFilter("all")
            }}
            onQueryChange={setQuery}
            query={query}
            searchLabel="Buscar mês ou ano..."
            totalItems={historyAnalysis.length}
            visibleItems={filteredHistory.length}
          >
            {availableYears.length > 2 ? (
              <CollectionFilterSelect
                label="Ano"
                onChange={setYearFilter}
                options={availableYears}
                value={yearFilter}
              />
            ) : null}
          </CollectionToolbar>

          {filteredHistory.length === 0 ? (
            <CollectionEmpty
              description="Nenhum registro encontrado para a busca ou ano selecionado."
              title="Nenhum mês encontrado"
            />
          ) : (
            <>
              {/* Tabela Desktop com Scroll Interno, Header Fixo e Linhas Clicáveis */}
              <div className="hidden md:block">
                <ResponsiveTable>
                  <div className="max-h-[30rem] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[200px]">Mês</TableHead>
                          <TableHead className="text-right">Receitas</TableHead>
                          <TableHead className="text-right">Despesas</TableHead>
                          <TableHead className="text-right">Meta</TableHead>
                          <TableHead className="text-right">Investido</TableHead>
                          <TableHead className="text-right">Orçamento livre</TableHead>
                          <TableHead className="text-right">Após investimentos</TableHead>
                          <TableHead className="text-right">Comprometido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item) => {
                          const isSelected = item.month === referenceMonthKey
                          const isLatest = item.month === latestMonth

                          return (
                            <TableRow
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-muted/60",
                                isSelected &&
                                  "bg-primary/10 hover:bg-primary/15 font-medium border-l-4 border-l-primary",
                              )}
                              key={item.id}
                              onClick={() => setSelectedMonthKey(item.month)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {formatMonth(item.month)}
                                  </span>
                                  {isSelected ? (
                                    <Badge className="text-[10px] h-5 px-1.5" variant="default">
                                      Ativo
                                    </Badge>
                                  ) : isLatest ? (
                                    <Badge className="text-[10px] h-5 px-1.5" variant="outline">
                                      Atual
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums text-finance-income font-medium">
                                {formatCurrency(item.income)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums text-finance-expense font-medium">
                                {formatCurrency(item.expenses)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                                {formatCurrency(item.plannedInvestment)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums font-medium">
                                {formatCurrency(item.investedAmount)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums font-semibold">
                                {formatCurrency(item.budgetAvailable)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                                {formatCurrency(item.budgetRemainingAfterInvestment)}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums">
                                {formatPercent(item.committed)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ResponsiveTable>
              </div>

              {/* Lista Cards Mobile Clicáveis */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredHistory.map((item) => {
                  const isSelected = item.month === referenceMonthKey
                  const isLatest = item.month === latestMonth

                  return (
                    <button
                      className={cn(
                        "w-full cursor-pointer rounded-xl border border-border bg-card p-4 text-left transition shadow-2xs hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30",
                      )}
                      key={item.id}
                      onClick={() => setSelectedMonthKey(item.month)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-bold text-foreground">
                            {formatMonth(item.month)}
                          </p>
                          {isSelected ? (
                            <Badge className="text-[10px] h-5 px-1.5" variant="default">
                              Ativo
                            </Badge>
                          ) : isLatest ? (
                            <Badge className="text-[10px] h-5 px-1.5" variant="outline">
                              Atual
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatPercent(item.committed)} comprometido
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Receitas</p>
                          <p className="mt-1 font-semibold tabular-nums text-finance-income">
                            {formatCurrency(item.income)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="mt-1 font-semibold tabular-nums text-finance-expense">
                            {formatCurrency(item.expenses)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                        <span className="text-xs text-muted-foreground">Orçamento livre</span>
                        <p className="font-heading font-bold tabular-nums">
                          {formatCurrency(item.budgetAvailable)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gráficos de Evolução e Composição */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Evolução do período</CardTitle>
              <CardDescription>
                {chartRange === "6m"
                  ? "Exibindo os últimos 6 meses de receitas, despesas e investimentos."
                  : chartRange === "12m"
                    ? "Exibindo os últimos 12 meses de receitas, despesas e investimentos."
                    : "Exibindo todo o histórico registrado de receitas, despesas e investimentos."}
              </CardDescription>
            </div>
            {/* Seletor de amplitude temporal do gráfico com alto contraste e clareza visual */}
            {historyAnalysis.length > 6 ? (
              <div className="flex items-center rounded-lg border border-border/80 bg-muted/50 p-1 text-xs font-medium shadow-2xs">
                <button
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 text-xs transition font-medium",
                    chartRange === "6m"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                  onClick={() => setChartRange("6m")}
                  type="button"
                >
                  6M
                </button>
                <button
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 text-xs transition font-medium",
                    chartRange === "12m"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                  onClick={() => setChartRange("12m")}
                  type="button"
                >
                  12M
                </button>
                <button
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 text-xs transition font-medium",
                    chartRange === "all"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                  onClick={() => setChartRange("all")}
                  type="button"
                >
                  Tudo
                </button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer className="h-[310px] w-full" config={historyChartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 16, right: 16, top: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
                <YAxis
                  axisLine={false}
                  domain={[0, "dataMax + 1000"]}
                  tickFormatter={(value) => formatShortCurrency(Number(value))}
                  tickLine={false}
                  width={64}
                />
                <ChartTooltip content={<CurrencyTooltip />} />
                <Line
                  dataKey="income"
                  dot={false}
                  stroke="var(--color-income)"
                  strokeWidth={2.5}
                  type="monotone"
                />
                <Line
                  dataKey="expenses"
                  dot={false}
                  stroke="var(--color-expenses)"
                  strokeWidth={2.5}
                  type="monotone"
                />
                <Line
                  dataKey="plannedInvestment"
                  dot={false}
                  stroke="var(--color-plannedInvestment)"
                  strokeWidth={2.5}
                  type="monotone"
                />
                <Line
                  dataKey="investedAmount"
                  dot={false}
                  stroke="var(--color-investedAmount)"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
              <ChartLegendItem color="var(--chart-1)" label="Receitas" />
              <ChartLegendItem color="var(--chart-2)" label="Despesas" />
              <ChartLegendItem color="var(--chart-4)" label="Investimento meta" />
              <ChartLegendItem color="var(--chart-3)" label="Investido" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle>Composição de {formatMonth(selectedMonth.month)}</CardTitle>
            <CardDescription>
              Valores fundamentais que explicam o mês de referência ativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[310px] w-full" config={distributionChartConfig}>
              <BarChart
                accessibilityLayer
                data={selectedMonthBreakdown}
                margin={{ left: 16, right: 16, top: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  interval={0}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, "dataMax + 1000"]}
                  tickFormatter={(value) => formatShortCurrency(Number(value))}
                  tickLine={false}
                  width={64}
                />
                <ChartTooltip content={<CurrencyTooltip />} />
                <Bar dataKey="value" radius={6}>
                  {selectedMonthBreakdown.map((item) => (
                    <Cell fill={item.color} key={item.label} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
