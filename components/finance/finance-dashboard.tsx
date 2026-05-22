"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CreditCardIcon,
  Edit3Icon,
  LineChartIcon,
  LogOutIcon,
  MenuIcon,
  PiggyBankIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SettingsIcon,
  TargetIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import {
  Controller,
  useForm,
  type UseFormRegisterReturn,
} from "react-hook-form"
import {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"
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
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getInstallmentProgress,
  getMonthlyHistory,
} from "@/features/finance/calculations"
import { getCurrentMonthKey } from "@/features/finance/demo-data"
import {
  expenseSchema,
  incomeSchema,
  investmentSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
  type IncomeFormInput,
  type IncomeFormValues,
  type InvestmentFormInput,
  type InvestmentFormValues,
} from "@/features/finance/schemas"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  type DemoUser,
  type ExpenseCategory,
  type ExpenseStatus,
  type FixedExpense,
  type Income,
  type IncomeFrequency,
  type IncomeType,
  type InvestmentEntry,
} from "@/features/finance/types"
import { useFinanceStore } from "@/features/finance/use-finance-store"
import {
  formatCurrency,
  formatDueDay,
  formatMonth,
  formatPercent,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"

type FinanceDashboardProps = {
  finance: ReturnType<typeof useFinanceStore>
  onDeleteAccount: () => void
  onLogout: () => void
  user: DemoUser
}

type FieldErrorLike = {
  message?: string
}

type SectionId =
  | "dashboard"
  | "incomes"
  | "expenses"
  | "investments"
  | "history"
  | "account"

const sections = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3Icon },
  { id: "incomes", label: "Receitas", icon: BanknoteArrowUpIcon },
  { id: "expenses", label: "Despesas", icon: CreditCardIcon },
  { id: "investments", label: "Investimentos", icon: PiggyBankIcon },
  { id: "history", label: "Histórico", icon: LineChartIcon },
  { id: "account", label: "Conta", icon: SettingsIcon },
] as const satisfies ReadonlyArray<{
  id: SectionId
  label: string
  icon: ComponentType
}>

const cashflowChartConfig = {
  expenses: {
    color: "var(--chart-2)",
    label: "Despesas",
  },
  income: {
    color: "var(--chart-1)",
    label: "Receitas",
  },
} satisfies ChartConfig

const investmentChartConfig = {
  investedAmount: {
    color: "var(--chart-3)",
    label: "Investido",
  },
  plannedInvestment: {
    color: "var(--chart-4)",
    label: "Planejado",
  },
} satisfies ChartConfig

const distributionChartConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Valor mensal",
  },
} satisfies ChartConfig

const pieColors = [
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--primary)",
  "oklch(0.64 0.16 10)",
]

export function FinanceDashboard({
  finance,
  onDeleteAccount,
  onLogout,
  user,
}: FinanceDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard")
  const [isPending, startTransition] = useTransition()
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentEntry | null>(null)
  const [expenseSearch, setExpenseSearch] = useState("")
  const deferredExpenseSearch = useDeferredValue(expenseSearch)
  const { state } = finance

  const summary = useMemo(() => calculateFinanceSummary(state), [state])
  const history = useMemo(() => getMonthlyHistory(state), [state])
  const distribution = useMemo(() => getExpenseDistribution(state), [state])

  const filteredExpenses = useMemo(() => {
    const query = deferredExpenseSearch.trim().toLowerCase()

    if (!query) {
      return state.expenses
    }

    return state.expenses.filter((expense) =>
      [expense.name, expense.category, expense.status, expense.notes]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [deferredExpenseSearch, state.expenses])

  function selectSection(sectionId: SectionId) {
    startTransition(() => {
      setActiveSection(sectionId)
    })
  }

  function openIncomeDialog(income?: Income) {
    setEditingIncome(income ?? null)
    setIsIncomeDialogOpen(true)
  }

  function openExpenseDialog(expense?: FixedExpense) {
    setEditingExpense(expense ?? null)
    setIsExpenseDialogOpen(true)
  }

  function openInvestmentDialog(investment?: InvestmentEntry) {
    setEditingInvestment(investment ?? null)
    setIsInvestmentDialogOpen(true)
  }

  function handleDeleteIncome(income: Income) {
    if (!window.confirm(`Excluir a receita "${income.name}"?`)) {
      return
    }

    finance.deleteIncome(income.id)
    toast.success("Receita excluída")
  }

  function handleDeleteExpense(expense: FixedExpense) {
    if (!window.confirm(`Excluir a despesa "${expense.name}"?`)) {
      return
    }

    finance.deleteExpense(expense.id)
    toast.success("Despesa excluída")
  }

  function handleDeleteInvestment(investment: InvestmentEntry) {
    if (!window.confirm(`Excluir o registro de ${formatMonth(investment.month)}?`)) {
      return
    }

    finance.deleteInvestment(investment.id)
    toast.success("Investimento excluído")
  }

  const renderedSection = {
    account: (
      <AccountSection
        finance={finance}
        onDeleteAccount={onDeleteAccount}
        onLogout={onLogout}
        user={user}
      />
    ),
    dashboard: (
      <OverviewSection
        distribution={distribution}
        history={history}
        onAddExpense={() => openExpenseDialog()}
        onAddIncome={() => openIncomeDialog()}
        onAddInvestment={() => openInvestmentDialog()}
        summary={summary}
      />
    ),
    expenses: (
      <ExpensesSection
        expenses={filteredExpenses}
        onAdd={() => openExpenseDialog()}
        onDelete={handleDeleteExpense}
        onEdit={openExpenseDialog}
        onSearch={setExpenseSearch}
        search={expenseSearch}
        summary={summary}
      />
    ),
    history: <HistorySection history={history} />,
    incomes: (
      <IncomesSection
        incomes={state.incomes}
        onAdd={() => openIncomeDialog()}
        onDelete={handleDeleteIncome}
        onEdit={openIncomeDialog}
        summary={summary}
      />
    ),
    investments: (
      <InvestmentsSection
        investments={state.investments.toSorted((a, b) => b.month.localeCompare(a.month))}
        onAdd={() => openInvestmentDialog()}
        onDelete={handleDeleteInvestment}
        onEdit={openInvestmentDialog}
        summary={summary}
      />
    ),
  } satisfies Record<SectionId, ReactNode>

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh lg:grid-cols-[17.5rem_1fr]">
        <AppSidebar
          activeSection={activeSection}
          isPending={isPending}
          onLogout={onLogout}
          onSelectSection={selectSection}
          user={user}
        />

        <section className="min-w-0 bg-[radial-gradient(circle_at_top_right,var(--brand-soft),transparent_34rem)]">
          <TopBar
            activeSection={activeSection}
            onLogout={onLogout}
            onSelectSection={selectSection}
            summary={summary}
            user={user}
          />
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-8">
            {renderedSection[activeSection]}
          </div>
        </section>
      </div>

      <IncomeDialog
        income={editingIncome}
        onOpenChange={setIsIncomeDialogOpen}
        onSubmit={(values) => {
          finance.upsertIncome(values, editingIncome?.id)
          toast.success(editingIncome ? "Receita atualizada" : "Receita adicionada")
        }}
        open={isIncomeDialogOpen}
      />

      <ExpenseDialog
        expense={editingExpense}
        onOpenChange={setIsExpenseDialogOpen}
        onSubmit={(values) => {
          finance.upsertExpense(values, editingExpense?.id)
          toast.success(editingExpense ? "Despesa atualizada" : "Despesa adicionada")
        }}
        open={isExpenseDialogOpen}
      />

      <InvestmentDialog
        investment={editingInvestment}
        onOpenChange={setIsInvestmentDialogOpen}
        onSubmit={(values) => {
          finance.upsertInvestment(values, editingInvestment?.id)
          toast.success(
            editingInvestment ? "Investimento atualizado" : "Investimento registrado"
          )
        }}
        open={isInvestmentDialogOpen}
      />
    </main>
  )
}

function AppSidebar({
  activeSection,
  isPending,
  onLogout,
  onSelectSection,
  user,
}: {
  activeSection: SectionId
  isPending: boolean
  onLogout: () => void
  onSelectSection: (section: SectionId) => void
  user: DemoUser
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r bg-sidebar/95 px-3 py-4 text-sidebar-foreground backdrop-blur lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <WalletCardsIcon />
        </div>
        <div>
          <p className="font-heading text-base font-semibold">Valion</p>
          <p className="text-xs text-muted-foreground">Controle pessoal</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Navegação principal">
        {sections.map((section) => (
          <button
            aria-current={activeSection === section.id ? "page" : undefined}
            className={cn(
              "flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              activeSection === section.id &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            )}
            disabled={isPending}
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            type="button"
          >
            <section.icon />
            {section.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border bg-background/70 px-2 py-2 shadow-none">
          <Avatar className="size-7">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button onClick={onLogout} variant="outline">
          <LogOutIcon data-icon="inline-start" />
          Sair
        </Button>
      </div>
    </aside>
  )
}

function TopBar({
  activeSection,
  onLogout,
  onSelectSection,
  summary,
  user,
}: {
  activeSection: SectionId
  onLogout: () => void
  onSelectSection: (section: SectionId) => void
  summary: ReturnType<typeof calculateFinanceSummary>
  user: DemoUser
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger render={<Button className="lg:hidden" size="icon" variant="outline" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent className="w-[21rem]" side="left">
              <SheetHeader>
                <SheetTitle>Valion</SheetTitle>
                <SheetDescription>Navegue pelas áreas financeiras.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Navegação mobile">
                {sections.map((section) => (
                  <Button
                    className="justify-start"
                    key={section.id}
                    onClick={() => onSelectSection(section.id)}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                  >
                    <section.icon data-icon="inline-start" />
                    {section.label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">Olá, {user.name}</p>
            <h1 className="truncate font-heading text-lg font-semibold sm:text-xl">
              {sections.find((section) => section.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-sm md:flex">
          <span className="text-muted-foreground">Saldo real</span>
          <strong className="font-mono tabular-nums">
            {formatCurrency(summary.realAvailableBalance)}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button className="hidden sm:inline-flex" onClick={onLogout} variant="outline">
            <LogOutIcon data-icon="inline-start" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}

function OverviewSection({
  distribution,
  history,
  onAddExpense,
  onAddIncome,
  onAddInvestment,
  summary,
}: {
  distribution: Array<{ category: string; value: number }>
  history: ReturnType<typeof getMonthlyHistory>
  onAddExpense: () => void
  onAddIncome: () => void
  onAddInvestment: () => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <div className="flex flex-col gap-6">
      <HeroSummary
        onAddExpense={onAddExpense}
        onAddIncome={onAddIncome}
        onAddInvestment={onAddInvestment}
        summary={summary}
      />
      <SummaryCards summary={summary} />
      <FinanceCharts distribution={distribution} history={history} />
      <InsightsPanel summary={summary} />
    </div>
  )
}

function HeroSummary({
  onAddExpense,
  onAddIncome,
  onAddInvestment,
  summary,
}: {
  onAddExpense: () => void
  onAddIncome: () => void
  onAddInvestment: () => void
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
            <Button onClick={onAddIncome}>
              <PlusIcon data-icon="inline-start" />
              Receita
            </Button>
            <Button onClick={onAddExpense} variant="outline">
              <PlusIcon data-icon="inline-start" />
              Despesa
            </Button>
            <Button onClick={onAddInvestment} variant="secondary">
              <PlusIcon data-icon="inline-start" />
              Investimento
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-background/80 p-5 shadow-inner">
          <p className="text-sm text-muted-foreground">Saldo real disponível</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(summary.realAvailableBalance)}
          </p>
          <Separator className="my-5" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Saldo livre</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(summary.freeBalance)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Investimento meta</p>
              <p className="mt-1 font-mono font-semibold tabular-nums">
                {formatCurrency(summary.plannedInvestment)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCards({
  summary,
}: {
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
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
      label: "Saldo livre",
      value: formatCurrency(summary.freeBalance),
    },
    {
      description: "Depois do investimento planejado",
      icon: TargetIcon,
      label: "Saldo real",
      value: formatCurrency(summary.realAvailableBalance),
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
            <BarChart accessibilityLayer data={chartHistory} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatShortCurrency(Number(value))}
                tickLine={false}
                width={48}
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
            <LineChart accessibilityLayer data={chartHistory} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatShortCurrency(Number(value))}
                tickLine={false}
                width={48}
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
          <CardDescription>Receita, despesas e saldo livre por mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[280px] w-full" config={cashflowChartConfig}>
            <AreaChart accessibilityLayer data={chartHistory} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatShortCurrency(Number(value))}
                tickLine={false}
                width={48}
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
        <CardContent className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <ChartContainer className="h-[260px] w-full" config={distributionChartConfig}>
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
          <div className="flex flex-col justify-center gap-3">
            {distribution.length ? (
              distribution.map((item, index) => (
                <div className="flex items-center justify-between gap-3" key={item.category}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <span className="truncate text-sm">{item.category}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
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

function CurrencyTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name) => (
        <>
          <span className="text-muted-foreground">{String(name)}</span>
          <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(Number(value))}
          </span>
        </>
      )}
    />
  )
}

function InsightsPanel({
  summary,
}: {
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const insight = getInvestmentInsight(summary.investmentInsight)
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
            <BudgetBadge value={summary.committedPercent} />
          </div>
          <Progress value={Math.min(summary.committedPercent, 100)} />
          <p className="text-sm text-muted-foreground">
            Abaixo de 50% tende a oferecer mais margem para imprevistos, amortizações e investimentos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insight de investimento</CardTitle>
          <CardDescription>Comparação entre planejado e realizado no mês.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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

function IncomesSection({
  incomes,
  onAdd,
  onDelete,
  onEdit,
  summary,
}: {
  incomes: Income[]
  onAdd: () => void
  onDelete: (income: Income) => void
  onEdit: (income: Income) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        actionLabel="Nova receita"
        description="Cadastre salário, freelance, pensão, renda extra, mesada ou outras entradas."
        onAction={onAdd}
        title="Controle de receitas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Receita mensal" value={formatCurrency(summary.monthlyIncome)} />
        <MetricCard label="Total comprometido" value={formatCurrency(summary.fixedExpenses)} />
        <MetricCard label="Saldo disponível" value={formatCurrency(summary.freeBalance)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas cadastradas</CardTitle>
          <CardDescription>Valores semanais e quinzenais são normalizados para o mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
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
                      <TableActions onDelete={() => onDelete(income)} onEdit={() => onEdit(income)} />
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

function ExpensesSection({
  expenses,
  onAdd,
  onDelete,
  onEdit,
  onSearch,
  search,
  summary,
}: {
  expenses: FixedExpense[]
  onAdd: () => void
  onDelete: (expense: FixedExpense) => void
  onEdit: (expense: FixedExpense) => void
  onSearch: (value: string) => void
  search: string
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        actionLabel="Nova despesa"
        description="Controle contas fixas, assinaturas, parcelamentos, empréstimos e financiamentos."
        onAction={onAdd}
        title="Controle de despesas fixas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total comprometido" value={formatCurrency(summary.fixedExpenses)} />
        <MetricCard label="Renda comprometida" value={formatPercent(summary.committedPercent)} />
        <MetricCard label="Parcelas restantes" value={String(summary.debtInstallmentsRemaining)} />
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Compromissos recorrentes</CardTitle>
            <CardDescription>Busque por nome, categoria, status ou observação.</CardDescription>
          </div>
          <div className="relative w-full lg:w-80">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Buscar despesas"
              value={search}
            />
          </div>
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
                {expenses.map((expense) => (
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
                      <TableActions onDelete={() => onDelete(expense)} onEdit={() => onEdit(expense)} />
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

function InvestmentsSection({
  investments,
  onAdd,
  onDelete,
  onEdit,
  summary,
}: {
  investments: InvestmentEntry[]
  onAdd: () => void
  onDelete: (investment: InvestmentEntry) => void
  onEdit: (investment: InvestmentEntry) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const insight = getInvestmentInsight(summary.investmentInsight)
  const InsightIcon = insight.icon

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        actionLabel="Registrar aporte"
        description="Defina o planejado, registre o realizado e compare a evolução mensal."
        onAction={onAdd}
        title="Controle de investimentos"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <MetricCard label="Planejado" value={formatCurrency(summary.plannedInvestment)} />
        <MetricCard label="Realizado" value={formatCurrency(summary.investedAmount)} />
        <MetricCard label="Saldo real disponível" value={formatCurrency(summary.realAvailableBalance)} />
      </div>

      <Alert>
        <InsightIcon />
        <AlertTitle>{insight.title}</AlertTitle>
        <AlertDescription>{insight.description}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Histórico mensal de investimentos</CardTitle>
          <CardDescription>Use o mês atual para calcular o saldo real disponível.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Planejado</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => {
                  const delta = investment.investedAmount - investment.plannedAmount

                  return (
                    <TableRow key={investment.id}>
                      <TableCell>{formatMonth(investment.month)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(investment.plannedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(investment.investedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(delta)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {investment.notes || "Sem observações"}
                      </TableCell>
                      <TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}

function HistorySection({ history }: { history: ReturnType<typeof getMonthlyHistory> }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Acompanhe a evolução de receitas, despesas, investimentos e saldo livre."
        title="Histórico financeiro"
      />

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal</CardTitle>
          <CardDescription>Snapshots históricos combinados com o mês atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Investido</TableHead>
                  <TableHead className="text-right">Saldo livre</TableHead>
                  <TableHead className="text-right">Comprometido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const freeBalance = item.income - item.expenses
                  const committed = item.income > 0 ? (item.expenses / item.income) * 100 : 0

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{formatMonth(item.month)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(item.income)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(item.expenses)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(item.investedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(freeBalance)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPercent(committed)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  )
}

function AccountSection({
  finance,
  onDeleteAccount,
  onLogout,
  user,
}: {
  finance: ReturnType<typeof useFinanceStore>
  onDeleteAccount: () => void
  onLogout: () => void
  user: DemoUser
}) {
  return (
    <div className="grid gap-5">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Conta e sessão</CardTitle>
          <CardDescription>Autenticação demo persistida no navegador.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onLogout} variant="outline">
              <LogOutIcon data-icon="inline-start" />
              Logout
            </Button>
            <Button
              onClick={() => {
                finance.resetWorkspace()
                toast.success("Dados demo restaurados")
              }}
              variant="secondary"
            >
              <RotateCcwIcon data-icon="inline-start" />
              Restaurar demo
            </Button>
            <Button
              onClick={() => {
                if (window.confirm("Excluir conta demo e dados locais?")) {
                  onDeleteAccount()
                }
              }}
              variant="destructive"
            >
              <Trash2Icon data-icon="inline-start" />
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

function IncomeDialog({
  income,
  onOpenChange,
  onSubmit,
  open,
}: {
  income: Income | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: IncomeFormValues) => void
  open: boolean
}) {
  const form = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    defaultValues: getIncomeDefaults(income),
    resolver: zodResolver(incomeSchema),
  })

  useEffect(() => {
    form.reset(getIncomeDefaults(income))
  }, [form, income, open])

  function submit(values: IncomeFormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{income ? "Editar receita" : "Nova receita"}</DialogTitle>
          <DialogDescription>Cadastre entradas mensais e frequências recorrentes.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField error={form.formState.errors.name} label="Nome" registration={form.register("name")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Tipo"
                    onValueChange={(value) => field.onChange(value as IncomeType)}
                    options={INCOME_TYPES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="frequency"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Frequência"
                    onValueChange={(value) => field.onChange(value as IncomeFrequency)}
                    options={INCOME_FREQUENCIES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <TextInputField
              error={form.formState.errors.amount}
              label="Valor"
              registration={form.register("amount")}
              type="number"
            />
            <TextareaField
              error={form.formState.errors.notes}
              label="Observações"
              registration={form.register("notes")}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar receita</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseDialog({
  expense,
  onOpenChange,
  onSubmit,
  open,
}: {
  expense: FixedExpense | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExpenseFormValues) => void
  open: boolean
}) {
  const form = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    defaultValues: getExpenseDefaults(expense),
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    form.reset(getExpenseDefaults(expense))
  }, [expense, form, open])

  function submit(values: ExpenseFormValues) {
    if (values.totalInstallments > 0 && values.remainingInstallments > values.totalInstallments) {
      form.setError("remainingInstallments", {
        message: "Parcelas restantes não podem exceder o total.",
        type: "validate",
      })
      return
    }

    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa fixa"}</DialogTitle>
          <DialogDescription>Registre compromissos mensais, parcelados ou contínuos.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField error={form.formState.errors.name} label="Nome" registration={form.register("name")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Categoria"
                    onValueChange={(value) => field.onChange(value as ExpenseCategory)}
                    options={EXPENSE_CATEGORIES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Status"
                    onValueChange={(value) => field.onChange(value as ExpenseStatus)}
                    options={EXPENSE_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.monthlyAmount}
                label="Valor mensal"
                registration={form.register("monthlyAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.dueDay}
                label="Data de vencimento"
                registration={form.register("dueDay")}
                type="number"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                description="Use 0 para despesas contínuas sem parcelas."
                error={form.formState.errors.totalInstallments}
                label="Total de parcelas"
                registration={form.register("totalInstallments")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.remainingInstallments}
                label="Parcelas restantes"
                registration={form.register("remainingInstallments")}
                type="number"
              />
            </div>
            <TextareaField
              error={form.formState.errors.notes}
              label="Observações"
              registration={form.register("notes")}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar despesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InvestmentDialog({
  investment,
  onOpenChange,
  onSubmit,
  open,
}: {
  investment: InvestmentEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: InvestmentFormValues) => void
  open: boolean
}) {
  const form = useForm<InvestmentFormInput, unknown, InvestmentFormValues>({
    defaultValues: getInvestmentDefaults(investment),
    resolver: zodResolver(investmentSchema),
  })

  useEffect(() => {
    form.reset(getInvestmentDefaults(investment))
  }, [form, investment, open])

  function submit(values: InvestmentFormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{investment ? "Editar investimento" : "Registrar investimento"}</DialogTitle>
          <DialogDescription>Compare valor planejado e realmente investido.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.month}
              label="Mês"
              registration={form.register("month")}
              type="month"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.plannedAmount}
                label="Valor planejado"
                registration={form.register("plannedAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.investedAmount}
                label="Valor investido"
                registration={form.register("investedAmount")}
                type="number"
              />
            </div>
            <TextareaField
              error={form.formState.errors.notes}
              label="Observações"
              registration={form.register("notes")}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar investimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeader({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel?: string
  description: string
  onAction?: () => void
  title: string
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <Button className="w-full sm:w-auto" onClick={onAction}>
          <PlusIcon data-icon="inline-start" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/90 shadow-sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function ResponsiveTable({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto rounded-xl border">{children}</div>
}

function TableActions({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button aria-label="Editar" onClick={onEdit} size="icon-sm" variant="ghost">
        <Edit3Icon />
      </Button>
      <Button aria-label="Excluir" onClick={onDelete} size="icon-sm" variant="ghost">
        <Trash2Icon />
      </Button>
    </div>
  )
}

function SelectField<T extends string>({
  error,
  label,
  onValueChange,
  options,
  value,
}: {
  error?: FieldErrorLike
  label: string
  onValueChange: (value: T) => void
  options: readonly T[]
  value: T
}) {
  const items = options.map((option) => ({ label: option, value: option }))

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(nextValue as T)
          }
        }}
        value={value}
      >
        <SelectTrigger aria-label={label} className="h-9 w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

function TextInputField({
  description,
  error,
  label,
  registration,
  type = "text",
}: {
  description?: string
  error?: FieldErrorLike
  label: string
  registration: UseFormRegisterReturn
  type?: string
}) {
  const id = registration.name

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        id={id}
        inputMode={type === "number" ? "decimal" : undefined}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        {...registration}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

function TextareaField({
  error,
  label,
  registration,
}: {
  error?: FieldErrorLike
  label: string
  registration: UseFormRegisterReturn
}) {
  const id = registration.name

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea aria-invalid={Boolean(error)} id={id} rows={3} {...registration} />
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

function BudgetBadge({ value }: { value: number }) {
  if (value >= 70) {
    return <Badge variant="destructive">Atenção</Badge>
  }

  if (value >= 50) {
    return <Badge variant="secondary">Monitorar</Badge>
  }

  return <Badge>Saudável</Badge>
}

function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const variant = status === "Ativa" ? "default" : status === "Pausada" ? "secondary" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

function getInvestmentInsight(status: "above" | "below" | "on-track") {
  if (status === "above") {
    return {
      description: "Você investiu acima do planejado. Ótimo momento para revisar se ainda há reserva para despesas variáveis.",
      icon: TrendingUpIcon,
      title: "Acima do planejado",
    }
  }

  if (status === "below") {
    return {
      description: "Você investiu abaixo do planejado. Avalie despesas flexíveis ou ajuste a meta para manter consistência.",
      icon: TrendingDownIcon,
      title: "Abaixo do planejado",
    }
  }

  return {
    description: "Você investiu exatamente o esperado para o mês. A rotina está alinhada ao plano definido.",
    icon: CheckCircle2Icon,
    title: "Dentro do esperado",
  }
}

function getIncomeDefaults(income: Income | null): IncomeFormValues {
  return {
    amount: income?.amount ?? 0,
    frequency: income?.frequency ?? "Mensal",
    name: income?.name ?? "",
    notes: income?.notes ?? "",
    type: income?.type ?? "Salário",
  }
}

function getExpenseDefaults(expense: FixedExpense | null): ExpenseFormValues {
  return {
    category: expense?.category ?? "Contas fixas",
    dueDay: expense?.dueDay ?? 10,
    monthlyAmount: expense?.monthlyAmount ?? 0,
    name: expense?.name ?? "",
    notes: expense?.notes ?? "",
    remainingInstallments: expense?.remainingInstallments ?? 0,
    status: expense?.status ?? "Ativa",
    totalInstallments: expense?.totalInstallments ?? 0,
  }
}

function getInvestmentDefaults(investment: InvestmentEntry | null): InvestmentFormValues {
  return {
    investedAmount: investment?.investedAmount ?? 0,
    month: investment?.month ?? getCurrentMonthKey(),
    notes: investment?.notes ?? "",
    plannedAmount: investment?.plannedAmount ?? 0,
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function formatShortCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${Math.round(value / 1000)} mil`
  }

  return formatCurrency(value)
}
