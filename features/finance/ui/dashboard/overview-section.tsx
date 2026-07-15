import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react"
import type { ComponentProps } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { AppSection } from "@/features/navigation/routes"
import {
  calculateFinanceSummary,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import {
  formatShortCurrency,
  getBudgetCommitmentStatus,
} from "@/features/finance/presentation/dashboard-view-models"
import { getInvestmentInsight } from "@/features/finance/ui/shared/dashboard-primitives"
import {
  cashflowChartConfig,
  distributionChartConfig,
  investmentChartConfig,
  pieColors,
} from "@/features/finance/ui/dashboard/chart-config"
import {
  formatCurrency,
  formatMonth,
  formatPercent,
} from "@/lib/formatters"

type SectionId = AppSection

export function OverviewSection({
  distribution,
  history,
  onNavigateSection,
  summary,
}: {
  distribution: Array<{ category: string; value: number }>
  history: ReturnType<typeof getMonthlyHistory>
  onNavigateSection: (section: SectionId) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <div className="flex flex-col gap-6">
      <HeroSummary onNavigateSection={onNavigateSection} summary={summary} />
      <SummaryCards summary={summary} />
      <FinanceCharts distribution={distribution} history={history} />
      <InsightsPanel summary={summary} />
    </div>
  )
}

function HeroSummary({
  onNavigateSection,
  summary,
}: {
  onNavigateSection: (section: SectionId) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <Card className="overflow-hidden border-foreground/10 bg-card/90 shadow-xl shadow-primary/5">
      <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <Badge variant="secondary">Resumo do mês atual</Badge>
            <h2 className="mt-4 max-w-2xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Seu orçamento está {formatPercent(summary.committedPercent)} comprometido.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Receita, despesas fixas e investimentos planejados são consolidados automaticamente para mostrar quanto ainda pode ser usado com segurança.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
              onClick={() => onNavigateSection("incomes")}
              variant="outline"
            >
              Receitas
            </Button>
            <Button
              className="border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-500/30 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
              onClick={() => onNavigateSection("expenses")}
              variant="outline"
            >
              Despesas
            </Button>
            <Button
              className="border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-500/30 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
              onClick={() => onNavigateSection("investments")}
              variant="outline"
            >
              Investimentos
            </Button>
            <Button
              className="border-violet-500/30 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 focus-visible:ring-violet-500/30 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
              onClick={() => onNavigateSection("goals")}
              variant="outline"
            >
              Metas
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-inner">
          <p className="text-sm text-muted-foreground">Orçamento livre</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(summary.budgetAvailable)}
          </p>
          <Separator className="my-5" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Investimento meta</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(summary.plannedInvestment)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Orçamento após investimentos</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(summary.budgetRemainingAfterInvestment)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCards({ summary }: { summary: ReturnType<typeof calculateFinanceSummary> }) {
  const cards = [
    {
      description: "Receita total mensal normalizada",
      icon: BanknoteArrowUpIcon,
      label: "Receitas",
      value: formatCurrency(summary.monthlyIncome),
    },
    {
      description: `${summary.activeExpensesCount} compromissos ativos`,
      icon: BanknoteArrowDownIcon,
      label: "Despesas fixas",
      value: formatCurrency(summary.fixedExpenses),
    },
    {
      description: "Receita menos despesas fixas",
      icon: WalletCardsIcon,
      label: "Orçamento livre",
      value: formatCurrency(summary.budgetAvailable),
    },
    {
      description: "Depois do investimento planejado",
      icon: TargetIcon,
      label: "Orçamento após investimentos",
      value: formatCurrency(summary.budgetRemainingAfterInvestment),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="mt-2 font-mono text-2xl tabular-nums">
                {card.value}
              </CardTitle>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <card.icon />
            </div>
          </CardHeader>
          <CardFooter className="pt-0 text-sm text-muted-foreground">
            {card.description}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function FinanceCharts({
  distribution,
  history,
}: {
  distribution: Array<{ category: string; value: number }>
  history: ReturnType<typeof getMonthlyHistory>
}) {
  const chartHistory = history.map((item) => ({
    ...item,
    label: formatMonth(item.month),
  }))

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Receitas x despesas</CardTitle>
          <CardDescription>Comparativo mensal com tooltip interativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[280px] w-full" config={cashflowChartConfig}>
            <BarChart accessibilityLayer data={chartHistory} margin={{ left: 24, right: 16, top: 12 }}>
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={6} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={6} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução de investimentos</CardTitle>
          <CardDescription>Planejado versus realizado ao longo dos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[280px] w-full" config={investmentChartConfig}>
            <LineChart accessibilityLayer data={chartHistory} margin={{ left: 24, right: 16, top: 12 }}>
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
              <ChartLegend content={<ChartLegendContent />} />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico financeiro</CardTitle>
          <CardDescription>Receita, despesas e orçamento livre por mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[280px] w-full" config={cashflowChartConfig}>
            <AreaChart accessibilityLayer data={chartHistory} margin={{ left: 24, right: 16, top: 12 }}>
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
              <Area
                dataKey="income"
                fill="var(--color-income)"
                fillOpacity={0.16}
                stroke="var(--color-income)"
                type="monotone"
              />
              <Area
                dataKey="expenses"
                fill="var(--color-expenses)"
                fillOpacity={0.08}
                stroke="var(--color-expenses)"
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoria</CardTitle>
          <CardDescription>Distribuição das despesas fixas ativas.</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-4 md:grid-cols-[minmax(11rem,0.78fr)_minmax(0,1.22fr)]">
          <ChartContainer className="mx-auto h-[240px] w-full max-w-[15rem]" config={distributionChartConfig}>
            <PieChart accessibilityLayer>
              <ChartTooltip content={<CurrencyTooltip />} />
              <Pie
                data={distribution}
                dataKey="value"
                innerRadius={58}
                nameKey="category"
                outerRadius={88}
                paddingAngle={3}
              >
                {distribution.map((item, index) => (
                  <Cell fill={pieColors[index % pieColors.length]} key={item.category} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex min-w-0 flex-col justify-center gap-3 p-3 md:mr-2">
            {distribution.length ? (
              distribution.map((item, index) => (
                <div className="flex min-w-0 items-center justify-between gap-3" key={item.category}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <span className="truncate text-sm">{item.category}</span>
                  </div>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Cadastre despesas para ver a distribuição.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CurrencyTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name) => (
        <>
          <span className="text-muted-foreground">{getChartTooltipLabel(name)}</span>
          <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(Number(value))}
          </span>
        </>
      )}
    />
  )
}

export function GoalTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name) => (
        <>
          <span className="text-muted-foreground">{getChartTooltipLabel(name)}</span>
          <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(Number(value))}
          </span>
        </>
      )}
      labelFormatter={(label) => String(label)}
    />
  )
}

const chartTooltipLabels: Record<string, string> = {
  cumulativeAmount: "Acumulado",
  expenses: "Despesas",
  income: "Receitas",
  investedAmount: "Investido",
  plannedInvestment: "Investimento meta",
  targetAmount: "Meta",
  value: "Valor mensal",
}

function getChartTooltipLabel(name: unknown) {
  const key = typeof name === "string" ? name : String(name)

  return chartTooltipLabels[key] ?? key
}

function InsightsPanel({ summary }: { summary: ReturnType<typeof calculateFinanceSummary> }) {
  const insight = getInvestmentInsight(summary.investmentInsight)
  const budgetStatus = getBudgetCommitmentStatus(summary.committedPercent)
  const Icon = insight.icon

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Percentual comprometido</CardTitle>
          <CardDescription>Quanto da renda já está reservado para despesas fixas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <span className="font-mono text-4xl font-semibold tabular-nums">
              {formatPercent(summary.committedPercent)}
            </span>
            <Badge className={budgetStatus.className}>{budgetStatus.label}</Badge>
          </div>
          <Progress value={Math.min(summary.committedPercent, 100)} />
          <p className="text-sm text-muted-foreground">{budgetStatus.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insight de investimento</CardTitle>
          <CardDescription>Comparação entre planejado e realizado no mês.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl text-primary">
            <Icon />
          </div>
          <div>
            <p className="font-medium">{insight.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {insight.description} Diferença atual: {formatCurrency(summary.investmentDelta)}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
