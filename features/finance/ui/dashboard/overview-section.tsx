import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  PiggyBankIcon,
  TargetIcon,
} from "lucide-react"
import { type ComponentProps, useState } from "react"
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type {
  calculateFinanceSummary,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import {
  formatShortCurrency,
  getBudgetCommitmentStatus,
} from "@/features/finance/presentation/dashboard-view-models"
import {
  cashflowChartConfig,
  distributionChartConfig,
  investmentChartConfig,
  pieColors,
} from "@/features/finance/ui/dashboard/chart-config"
import { getInvestmentInsight, MetricCard } from "@/features/finance/ui/shared/dashboard-primitives"
import type { AppSection } from "@/features/navigation/routes"
import { formatCurrency, formatMonth, formatPercent } from "@/lib/formatters"

type SectionId = AppSection

export function OverviewSection({
  distribution,
  hasFinancialData,
  history,
  onNavigateSection,
  summary,
}: {
  distribution: Array<{ category: string; value: number }>
  hasFinancialData: boolean
  history: ReturnType<typeof getMonthlyHistory>
  onNavigateSection: (section: SectionId) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <div className="flex flex-col gap-6">
      {hasFinancialData ? (
        <>
          <HeroSummary onNavigateSection={onNavigateSection} summary={summary} />
          <SummaryCards summary={summary} />
          <FinanceCharts distribution={distribution} history={history} />
          <InsightsPanel summary={summary} />
        </>
      ) : (
        <>
          <Card className="border-primary bg-primary text-primary-foreground shadow-none">
            <CardContent className="py-4 sm:py-8">
              <p className="text-sm font-medium text-white/75">Bem-vindo ao Valion</p>
              <h2 className="mt-4 max-w-2xl font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Seu dinheiro, mais claro a partir de agora.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Adicione os primeiros dados e veja seu orçamento, comparativos e planos ganharem
                forma neste painel.
              </p>
            </CardContent>
          </Card>
          <GettingStarted onNavigateSection={onNavigateSection} />
        </>
      )}
    </div>
  )
}

function GettingStarted({
  onNavigateSection,
}: {
  onNavigateSection: (section: SectionId) => void
}) {
  const steps = [
    {
      description: "Adicione salário ou outras entradas para conhecer sua renda mensal.",
      icon: BanknoteArrowUpIcon,
      label: "Registre suas receitas",
      section: "incomes" as const,
    },
    {
      description: "Inclua contas fixas e veja quanto da renda já está comprometido.",
      icon: BanknoteArrowDownIcon,
      label: "Organize suas despesas",
      section: "expenses" as const,
    },
    {
      description: "Defina valores planejados e acompanhe o que conseguiu investir.",
      icon: PiggyBankIcon,
      label: "Planeje investimentos",
      section: "investments" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-finance-income-soft text-finance-income">
          <CircleCheckIcon className="size-5" />
        </div>
        <CardTitle className="font-heading text-xl font-extrabold">Comece por aqui</CardTitle>
        <CardDescription>
          Seu painel ganha vida conforme você registra os primeiros dados. Escolha uma área para
          começar.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {steps.map((step, index) => (
          <button
            className="group flex min-h-40 cursor-pointer flex-col items-start rounded-xl border border-border bg-background p-5 text-left transition hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            key={step.section}
            onClick={() => onNavigateSection(step.section)}
            type="button"
          >
            <span className="flex w-full items-center justify-between">
              <step.icon className="size-5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-muted-foreground">
                0{index + 1}
              </span>
            </span>
            <span className="mt-5 font-heading text-base font-bold">{step.label}</span>
            <span className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
              Acessar área{" "}
              <ChevronRightIcon className="size-4 transition group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
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
    <Card className="overflow-hidden border-primary bg-primary py-0 text-primary-foreground shadow-none">
      <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-white/80">Resumo do mês atual</p>
            <p className="mt-6 text-sm text-white/75">Orçamento livre</p>
            <h2 className="mt-1 max-w-2xl font-heading text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
              {formatCurrency(summary.budgetAvailable)}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              O valor disponível depois das despesas fixas deste mês.
            </p>
          </div>
          <Button
            className="w-fit border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => onNavigateSection("history")}
            variant="outline"
          >
            Ver histórico <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>

        <div className="self-center border-t border-white/20 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm text-white/75">Da renda comprometida</p>
          <p className="mt-2 font-heading text-4xl font-bold tracking-tight tabular-nums">
            {formatPercent(summary.committedPercent)}
          </p>
          <Progress
            className="mt-4 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/20 [&_[data-slot=progress-indicator]]:bg-white"
            value={Math.min(summary.committedPercent, 100)}
          />
          <Separator className="my-5 bg-white/20" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70">Investimento meta</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(summary.plannedInvestment)}
              </p>
            </div>
            <div>
              <p className="text-white/70">Após investimentos</p>
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
      hint: "Total mensal normalizado",
      icon: BanknoteArrowUpIcon,
      label: "Receitas",
      tone: "income" as const,
      value: formatCurrency(summary.monthlyIncome),
    },
    {
      hint: `${summary.activeExpensesCount} compromisso(s) ativo(s)`,
      icon: BanknoteArrowDownIcon,
      label: "Despesas",
      tone: "expense" as const,
      value: formatCurrency(summary.fixedExpenses),
    },
    {
      hint: "Meta para o mês",
      icon: PiggyBankIcon,
      label: "Investimento planejado",
      tone: "info" as const,
      value: formatCurrency(summary.plannedInvestment),
    },
    {
      hint: "Depois do plano de investimento",
      icon: TargetIcon,
      label: "Saldo projetado",
      tone: "neutral" as const,
      value: formatCurrency(summary.budgetRemainingAfterInvestment),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricCard
          hint={card.hint}
          icon={card.icon}
          key={card.label}
          label={card.label}
          tone={card.tone}
          value={card.value}
        />
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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const activeCategory = hoveredCategory ?? selectedCategory
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
            <BarChart
              accessibilityLayer
              data={chartHistory}
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={6} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={0} />
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
            <LineChart
              accessibilityLayer
              data={chartHistory}
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
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="plannedInvestment"
                dot={false}
                stroke="var(--color-plannedInvestment)"
                strokeWidth={3}
                type="monotone"
              />
              <Line
                dataKey="investedAmount"
                dot={false}
                stroke="var(--color-investedAmount)"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Gastos por categoria</CardTitle>
          <CardDescription>Distribuição das despesas fixas ativas.</CardDescription>
        </CardHeader>
        <CardContent className="mx-auto grid w-full max-w-4xl items-center gap-4 md:grid-cols-[minmax(11rem,0.78fr)_minmax(0,1.22fr)]">
          <ChartContainer
            className="mx-auto h-[240px] w-full max-w-[15rem]"
            config={distributionChartConfig}
          >
            <PieChart accessibilityLayer>
              <ChartTooltip content={<CurrencyTooltip />} />
              <Pie
                className="cursor-pointer"
                data={distribution}
                dataKey="value"
                innerRadius={58}
                nameKey="category"
                onClick={(_, index) => {
                  const clickedCategory = distribution[index]?.category
                  if (clickedCategory) {
                    setSelectedCategory((current) =>
                      current === clickedCategory ? null : clickedCategory,
                    )
                  }
                }}
                onMouseEnter={(_, index) =>
                  setHoveredCategory(distribution[index]?.category ?? null)
                }
                onMouseLeave={() => setHoveredCategory(null)}
                outerRadius={88}
                paddingAngle={3}
              >
                {distribution.map((item, index) => (
                  <Cell
                    className="cursor-pointer"
                    fill={pieColors[index % pieColors.length]}
                    fillOpacity={activeCategory && activeCategory !== item.category ? 0.3 : 1}
                    key={item.category}
                    stroke={activeCategory === item.category ? "var(--background)" : "transparent"}
                    strokeWidth={activeCategory === item.category ? 3 : 0}
                    style={{ cursor: "pointer", transition: "fill-opacity 160ms ease" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex min-w-0 flex-col justify-center gap-1 p-3 md:mr-2">
            {distribution.length ? (
              distribution.map((item, index) => (
                <button
                  aria-label={`${item.category}: ${formatCurrency(item.value)}`}
                  aria-pressed={selectedCategory === item.category}
                  className={`flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === item.category ? "bg-muted" : ""}`}
                  key={item.category}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() =>
                    setSelectedCategory((current) =>
                      current === item.category ? null : item.category,
                    )
                  }
                  onFocus={() => setHoveredCategory(item.category)}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  type="button"
                >
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
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Cadastre despesas para ver a distribuição.
              </p>
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
