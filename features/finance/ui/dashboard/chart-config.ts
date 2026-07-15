import type { ChartConfig } from "@/components/ui/chart"

export const cashflowChartConfig = {
  expenses: {
    color: "var(--chart-2)",
    label: "Despesas",
  },
  income: {
    color: "var(--chart-1)",
    label: "Receitas",
  },
} satisfies ChartConfig

export const investmentChartConfig = {
  investedAmount: {
    color: "var(--chart-3)",
    label: "Investido",
  },
  plannedInvestment: {
    color: "var(--chart-4)",
    label: "Planejado",
  },
} satisfies ChartConfig

export const goalChartConfig = {
  cumulativeAmount: {
    color: "var(--chart-3)",
    label: "Acumulado",
  },
  targetAmount: {
    color: "var(--chart-4)",
    label: "Meta",
  },
} satisfies ChartConfig

export const historyChartConfig = {
  income: {
    color: "var(--chart-1)",
    label: "Receitas",
  },
  expenses: {
    color: "var(--chart-2)",
    label: "Despesas",
  },
  plannedInvestment: {
    color: "var(--chart-4)",
    label: "Investimento meta",
  },
  investedAmount: {
    color: "var(--chart-3)",
    label: "Investido",
  },
} satisfies ChartConfig

export const distributionChartConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Valor mensal",
  },
} satisfies ChartConfig

export const pieColors = [
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--primary)",
  "oklch(0.64 0.16 10)",
]
