"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { getMonthlyHistory } from "@/features/finance/domain/calculations"
import { formatShortCurrency } from "@/features/finance/presentation/dashboard-view-models"
import {
  distributionChartConfig,
  historyChartConfig,
} from "@/features/finance/ui/dashboard/chart-config"
import { CurrencyTooltip } from "@/features/finance/ui/dashboard/overview-section"
import { ChartLegendItem, TrendDelta } from "@/features/finance/ui/sections/section-helpers"
import { ResponsiveTable, SectionHeader } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatMonth, formatMonthChip, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export function HistorySection({ history }: { history: ReturnType<typeof getMonthlyHistory> }) {
  const orderedHistory = useMemo(
    () => history.toSorted((a, b) => a.month.localeCompare(b.month)),
    [history],
  )
  const latestMonth = orderedHistory.at(-1)?.month ?? ""
  const [selectedMonthKey, setSelectedMonthKey] = useState(latestMonth)
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
  const selectableMonths = historyAnalysis.slice(-5)
  const referenceMonthKey = selectableMonths.some((item) => item.month === selectedMonthKey)
    ? selectedMonthKey
    : latestMonth
  const selectedIndex = historyAnalysis.findIndex((item) => item.month === referenceMonthKey)
  const selectedMonth = historyAnalysis[selectedIndex]
  const previousMonth = selectedIndex > 0 ? historyAnalysis[selectedIndex - 1] : null

  if (!selectedMonth) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHeader
          description="Acompanhe a evolução de receitas, despesas, investimentos e orçamento livre."
          title="Histórico financeiro"
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não existem meses no histórico para analisar.
          </CardContent>
        </Card>
      </div>
    )
  }

  const comparisonCards = [
    {
      delta: selectedMonth.income - (previousMonth?.income ?? selectedMonth.income),
      label: "Receitas",
      value: formatCurrency(selectedMonth.income),
    },
    {
      delta: selectedMonth.expenses - (previousMonth?.expenses ?? selectedMonth.expenses),
      inverse: true,
      label: "Despesas",
      value: formatCurrency(selectedMonth.expenses),
    },
    {
      delta:
        selectedMonth.budgetAvailable -
        (previousMonth?.budgetAvailable ?? selectedMonth.budgetAvailable),
      label: "Orçamento livre",
      value: formatCurrency(selectedMonth.budgetAvailable),
    },
    {
      delta: selectedMonth.committed - (previousMonth?.committed ?? selectedMonth.committed),
      inverse: true,
      kind: "percent" as const,
      label: "Comprometido",
      value: formatPercent(selectedMonth.committed),
    },
  ]
  const selectedMonthBreakdown = [
    { color: "var(--chart-1)", label: "Receitas", value: selectedMonth.income },
    { color: "var(--chart-2)", label: "Despesas", value: selectedMonth.expenses },
    {
      color: "var(--chart-4)",
      label: "Investimento meta",
      value: selectedMonth.plannedInvestment,
    },
    { color: "var(--chart-3)", label: "Investido", value: selectedMonth.investedAmount },
  ]

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Escolha um mês de referência e compare evolução, orçamento livre, despesas e investimentos ao longo do tempo."
        title="Histórico financeiro"
      />

      <Card className="border-foreground/10 bg-card/90 py-0 shadow-xl shadow-primary/5">
        <CardHeader className="bg-card px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="secondary">Mês de referência</Badge>
              <CardTitle className="mt-3 text-2xl">{formatMonth(selectedMonth.month)}</CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Análise aprofundada do mês selecionado, comparando contra o mês anterior e a média
                do histórico.
              </CardDescription>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {selectableMonths.map((item) => (
                <button
                  aria-pressed={item.month === referenceMonthKey}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    item.month === referenceMonthKey &&
                      "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
                  )}
                  key={item.month}
                  onClick={() => setSelectedMonthKey(item.month)}
                  type="button"
                >
                  {formatMonthChip(item.month)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {comparisonCards.map((card) => (
          <Card className="bg-card/90 shadow-sm" key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">{card.value}</CardTitle>
            </CardHeader>
            <CardFooter className="justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {previousMonth ? `vs ${formatMonth(previousMonth.month)}` : "Primeiro mês"}
              </span>
              <TrendDelta inverse={card.inverse} kind={card.kind} value={card.delta} />
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do período</CardTitle>
            <CardDescription>
              Receitas, despesas, meta de investimento e valor investido mês a mês.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer className="h-[320px] w-full" config={historyChartConfig}>
              <LineChart
                accessibilityLayer
                data={historyAnalysis}
                margin={{ left: 24, right: 16, top: 12 }}
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

        <Card>
          <CardHeader>
            <CardTitle>Composição de {formatMonth(selectedMonth.month)}</CardTitle>
            <CardDescription>Leitura concentrada dos valores que explicam o mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[320px] w-full" config={distributionChartConfig}>
              <BarChart
                accessibilityLayer
                data={selectedMonthBreakdown}
                margin={{ left: 24, right: 16, top: 12 }}
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

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento mensal</CardTitle>
          <CardDescription>
            Tabela completa com o mês de referência destacado para leitura comparativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
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
                {selectableMonths.map((item) => (
                  <TableRow
                    className={cn(item.month === referenceMonthKey && "bg-primary/5")}
                    key={item.id}
                  >
                    <TableCell className="font-medium">{formatMonth(item.month)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.income)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.expenses)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.plannedInvestment)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.investedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.budgetAvailable)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(item.budgetRemainingAfterInvestment)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatPercent(item.committed)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  )
}
