"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BarChart3Icon,
  CameraIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  CreditCardIcon,
  Edit3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LineChartIcon,
  LogOutIcon,
  MenuIcon,
  PiggyBankIcon,
  PlusIcon,
  SettingsIcon,
  XIcon,
  TargetIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import {
  Controller,
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form"
import {
  type ComponentProps,
  type ComponentType,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
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
  ReferenceLine,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardAction,
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
  DialogClose,
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
  SheetFooter,
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
import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getInstallmentProgress,
  getMonthlyHistory,
} from "@/features/finance/calculations"
import { getCurrentDateKey, getCurrentMonthKey } from "@/features/finance/initial-data"
import {
  expenseSchema,
  goalContributionSchema,
  goalSchema,
  incomeSchema,
  investmentSchema,
  reminderSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
  type GoalContributionFormInput,
  type GoalContributionFormValues,
  type GoalFormInput,
  type GoalFormValues,
  type IncomeFormInput,
  type IncomeFormValues,
  type InvestmentFormInput,
  type InvestmentFormValues,
  type ReminderFormInput,
  type ReminderFormValues,
} from "@/features/finance/schemas"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  GOAL_STATUSES,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  REMINDER_FREQUENCIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ChargeReminder,
  type AppUser,
  type ExpenseCategory,
  type ExpenseStatus,
  type FixedExpense,
  type Goal,
  type GoalContribution,
  type GoalStatus,
  type Income,
  type IncomeFrequency,
  type IncomeType,
  type InvestmentEntry,
  type ReminderFrequency,
  type ReminderStatus,
  type ReminderType,
} from "@/features/finance/types"
import { useFinanceStore } from "@/features/finance/use-finance-store"
import type { AppSection } from "@/features/navigation/routes"
import {
  formatCurrency,
  formatDueDay,
  formatDateKey,
  formatDateKeyLong,
  formatMonth,
  formatMonthChip,
  formatPercent,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"

type FinanceDashboardProps = {
  activeSection?: AppSection
  finance: ReturnType<typeof useFinanceStore>
  onDeleteAccount: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onNavigateSection?: (section: AppSection) => void
  onRequestPasswordReset: () => void
  onUpdateUser: (user: AppUser) => Promise<void> | void
  user: AppUser
}

type FieldErrorLike = {
  message?: string
}

type SectionId = AppSection

const sections = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3Icon },
  { id: "incomes", label: "Receitas", icon: BanknoteArrowUpIcon },
  { id: "expenses", label: "Despesas", icon: CreditCardIcon },
  { id: "investments", label: "Investimentos", icon: PiggyBankIcon },
  { id: "goals", label: "Metas", icon: TargetIcon },
  { id: "history", label: "Histórico", icon: LineChartIcon },
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

const goalChartConfig = {
  cumulativeAmount: {
    color: "var(--chart-3)",
    label: "Acumulado",
  },
  targetAmount: {
    color: "var(--chart-4)",
    label: "Meta",
  },
} satisfies ChartConfig

const historyChartConfig = {
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

const TABLE_PAGE_SIZE = 10

const incomeActionClassName =
  "border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"

const expenseActionClassName =
  "border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-500/30 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"

const reminderActionClassName =
  "border-orange-400/40 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20"

const newActionButtonClassName = "min-w-[9.5rem]"

function getActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação."
}

export function FinanceDashboard({
  activeSection,
  finance,
  onDeleteAccount,
  onLogout,
  onNavigateSection,
  onRequestPasswordReset,
  onUpdateUser,
  user,
}: FinanceDashboardProps) {
  const [internalActiveSection, setInternalActiveSection] = useState<SectionId>("dashboard")
  const [isPending, startTransition] = useTransition()
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentEntry | null>(null)
  const [editingReminder, setEditingReminder] = useState<ChargeReminder | null>(null)
  const { state } = finance

  const summary = useMemo(() => calculateFinanceSummary(state), [state])
  const history = useMemo(() => getMonthlyHistory(state), [state])
  const distribution = useMemo(() => getExpenseDistribution(state), [state])
  const currentSection = activeSection ?? internalActiveSection

  function selectSection(sectionId: SectionId) {
    if (onNavigateSection) {
      onNavigateSection(sectionId)
      return
    }

    startTransition(() => {
      setInternalActiveSection(sectionId)
    })
  }

  async function runFinanceAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action()
      toast.success(successMessage)
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: getActionErrorMessage(error),
      })
      throw error
    }
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

  function openReminderDialog(reminder?: ChargeReminder) {
    setEditingReminder(reminder ?? null)
    setIsReminderDialogOpen(true)
  }

  async function handleDeleteIncome(income: Income) {
    if (!window.confirm(`Excluir a receita "${income.name}"?`)) {
      return
    }

    await runFinanceAction(() => finance.deleteIncome(income.id), "Receita excluída")
  }

  async function handleDeleteExpense(expense: FixedExpense) {
    if (!window.confirm(`Excluir a despesa "${expense.name}"?`)) {
      return
    }

    await runFinanceAction(() => finance.deleteExpense(expense.id), "Despesa excluída")
  }

  async function handleDeleteInvestment(investment: InvestmentEntry) {
    if (!window.confirm(`Excluir o registro de ${formatMonth(investment.month)}?`)) {
      return
    }

    await runFinanceAction(() => finance.deleteInvestment(investment.id), "Investimento excluído")
  }

  async function handleDeleteReminder(reminder: ChargeReminder) {
    if (!window.confirm(`Excluir o lembrete "${reminder.name}"?`)) {
      return
    }

    await runFinanceAction(() => finance.deleteReminder(reminder.id), "Lembrete excluído")
  }

  async function handleMarkReminderReceived(reminder: ChargeReminder) {
    await runFinanceAction(
      () => finance.markReminderReceived(reminder.id),
      reminder.type === "Parcelado" && reminder.remainingInstallments <= 1
        ? "Lembrete concluído"
        : "Cobrança marcada como recebida"
    )
  }

  const renderedSection = {
    dashboard: (
      <OverviewSection
        distribution={distribution}
        history={history}
        onNavigateSection={selectSection}
        summary={summary}
      />
    ),
    expenses: (
      <ExpensesSection
        expenses={state.expenses}
        onAdd={() => openExpenseDialog()}
        onDelete={handleDeleteExpense}
        onEdit={openExpenseDialog}
        summary={summary}
      />
    ),
    goals: <GoalsSection finance={finance} />,
    history: <HistorySection history={history} />,
    incomes: (
      <IncomesSection
        incomes={state.incomes}
        onAdd={() => openIncomeDialog()}
        onAddReminder={() => openReminderDialog()}
        onDelete={handleDeleteIncome}
        onDeleteReminder={handleDeleteReminder}
        onEdit={openIncomeDialog}
        onEditReminder={openReminderDialog}
        onMarkReminderReceived={handleMarkReminderReceived}
        reminders={state.reminders}
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
          activeSection={currentSection}
          isPending={isPending}
          onOpenAccount={() => setIsAccountDialogOpen(true)}
          onSelectSection={selectSection}
          user={user}
        />

        <section className="min-w-0 bg-[radial-gradient(circle_at_top_right,var(--brand-soft),transparent_34rem)]">
          <TopBar
            activeSection={currentSection}
            onLogout={onLogout}
            onOpenAccount={() => setIsAccountDialogOpen(true)}
            onSelectSection={selectSection}
            user={user}
          />
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-8">
            {renderedSection[currentSection]}
          </div>
        </section>
      </div>

      {isIncomeDialogOpen ? (
        <IncomeDialog
          income={editingIncome}
          onOpenChange={setIsIncomeDialogOpen}
          onSubmit={async (values) => {
            await runFinanceAction(
              () => finance.upsertIncome(values, editingIncome?.id),
              editingIncome ? "Receita atualizada" : "Receita adicionada"
            )
          }}
          open={isIncomeDialogOpen}
        />
      ) : null}

      {isExpenseDialogOpen ? (
        <ExpenseDialog
          expense={editingExpense}
          onOpenChange={setIsExpenseDialogOpen}
          onSubmit={async (values) => {
            await runFinanceAction(
              () => finance.upsertExpense(values, editingExpense?.id),
              editingExpense ? "Despesa atualizada" : "Despesa adicionada"
            )
          }}
          open={isExpenseDialogOpen}
        />
      ) : null}

      {isInvestmentDialogOpen ? (
        <InvestmentDialog
          investment={editingInvestment}
          onOpenChange={setIsInvestmentDialogOpen}
          onSubmit={async (values) => {
            await runFinanceAction(
              () => finance.upsertInvestment(values, editingInvestment?.id),
              editingInvestment ? "Investimento atualizado" : "Investimento registrado"
            )
          }}
          open={isInvestmentDialogOpen}
        />
      ) : null}

      {isReminderDialogOpen ? (
        <ReminderDialog
          onOpenChange={setIsReminderDialogOpen}
          onSubmit={async (values) => {
            await runFinanceAction(
              () => finance.upsertReminder(normalizeReminderFormValues(values), editingReminder?.id),
              editingReminder ? "Lembrete atualizado" : "Lembrete adicionado"
            )
          }}
          open={isReminderDialogOpen}
          reminder={editingReminder}
        />
      ) : null}

      {isAccountDialogOpen ? (
        <AccountDialog
          onDeleteAccount={onDeleteAccount}
          onLogout={onLogout}
          onOpenChange={setIsAccountDialogOpen}
          onRequestPasswordReset={onRequestPasswordReset}
          onUpdateUser={onUpdateUser}
          open={isAccountDialogOpen}
          user={user}
        />
      ) : null}
    </main>
  )
}

function AppSidebar({
  activeSection,
  isPending,
  onOpenAccount,
  onSelectSection,
  user,
}: {
  activeSection: SectionId
  isPending: boolean
  onOpenAccount: () => void
  onSelectSection: (section: SectionId) => void
  user: AppUser
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
        <button
          aria-label="Abrir conta e sessão"
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border bg-background/70 px-2 py-2 text-left shadow-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={onOpenAccount}
          type="button"
        >
          <Avatar className="size-7">
            {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <ChevronRightIcon className="text-muted-foreground" />
        </button>
      </div>
    </aside>
  )
}

function TopBar({
  activeSection,
  onLogout,
  onOpenAccount,
  onSelectSection,
  user,
}: {
  activeSection: SectionId
  onLogout: () => Promise<void> | void
  onOpenAccount: () => void
  onSelectSection: (section: SectionId) => void
  user: AppUser
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  function handleSelectSection(section: SectionId) {
    setIsMobileNavOpen(false)
    onSelectSection(section)
  }

  function handleOpenAccount() {
    setIsMobileNavOpen(false)
    onOpenAccount()
  }

  return (
    <header className="sticky relative top-0 z-30 border-b bg-background/82 backdrop-blur-xl">
      <div className="relative flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Sheet onOpenChange={setIsMobileNavOpen} open={isMobileNavOpen}>
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
                    onClick={() => handleSelectSection(section.id)}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                  >
                    <section.icon data-icon="inline-start" />
                    {section.label}
                  </Button>
                ))}
              </nav>
              <SheetFooter>
                <button
                  aria-label="Abrir conta e sessão"
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border bg-background/70 px-2 py-2 text-left shadow-none transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={handleOpenAccount}
                  type="button"
                >
                  <Avatar className="size-7">
                    {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  <SettingsIcon className="text-muted-foreground" />
                </button>
                <Button onClick={onLogout} variant="outline">
                  <LogOutIcon className="text-destructive" data-icon="inline-start" />
                  Sair
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">Olá, {user.name}</p>
            <h1 className="truncate font-heading text-lg font-semibold sm:text-xl">
              {sections.find((section) => section.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button className="hidden sm:inline-flex" onClick={onLogout} variant="outline">
            <LogOutIcon className="text-destructive" data-icon="inline-start" />
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
      <HeroSummary
        onNavigateSection={onNavigateSection}
        summary={summary}
      />
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

function CurrencyTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name) => (
        <>
          <span className="text-muted-foreground">
            {getChartTooltipLabel(name)}
          </span>
          <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(Number(value))}
          </span>
        </>
      )}
      />
  )
}

function GoalTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
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

function InsightsPanel({
  summary,
}: {
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
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

function IncomesSection({
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
  const [page, setPage] = useState(1)
  const pageCount = Math.max(Math.ceil(incomes.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedIncomes = useMemo(
    () => incomes.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, incomes]
  )

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Cadastre salário, freelance, pensão, renda extra, mesada ou outras entradas."
        title="Controle de receitas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Receita mensal" value={formatCurrency(summary.monthlyIncome)} />
        <MetricCard label="Total comprometido" value={formatCurrency(summary.fixedExpenses)} />
        <MetricCard label="Orçamento livre" value={formatCurrency(summary.budgetAvailable)} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Receitas cadastradas</CardTitle>
            <CardDescription>Valores semanais e quinzenais são normalizados para o mês.</CardDescription>
          </div>
          <CardAction>
            <Button className={cn(newActionButtonClassName, incomeActionClassName)} onClick={onAdd}>
              <PlusIcon data-icon="inline-start" />
              Nova receita
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
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
                {paginatedIncomes.map((income) => (
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
          <PaginationControls
            currentPage={currentPage}
            itemLabel="receitas"
            onPageChange={setPage}
            pageCount={pageCount}
            totalItems={incomes.length}
          />
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

function RemindersCard({
  onAdd,
  onDelete,
  onEdit,
  onMarkReceived,
  reminders,
}: {
  onAdd: () => void
  onDelete: (reminder: ChargeReminder) => Promise<void> | void
  onEdit: (reminder: ChargeReminder) => void
  onMarkReceived: (reminder: ChargeReminder) => Promise<void> | void
  reminders: ChargeReminder[]
}) {
  const [page, setPage] = useState(1)
  const today = getCurrentDateKey()
  const orderedReminders = useMemo(
    () =>
      reminders.toSorted((a, b) => {
        const statusDelta = getReminderStatusPriority(a) - getReminderStatusPriority(b)

        if (statusDelta !== 0) {
          return statusDelta
        }

        return a.nextDueDate.localeCompare(b.nextDueDate)
      }),
    [reminders]
  )
  const pageCount = Math.max(Math.ceil(orderedReminders.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedReminders = useMemo(
    () =>
      orderedReminders.slice(
        (currentPage - 1) * TABLE_PAGE_SIZE,
        currentPage * TABLE_PAGE_SIZE
      ),
    [currentPage, orderedReminders]
  )

  return (
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Lembretes</CardTitle>
          <CardDescription>
            Controle cobranças recorrentes ou parceladas sem interferir nas receitas do dashboard.
          </CardDescription>
        </div>
        <CardAction>
          <Button className={cn(newActionButtonClassName, reminderActionClassName)} onClick={onAdd}>
            <PlusIcon data-icon="inline-start" />
            Novo lembrete
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cobrança</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Próxima cobrança</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReminders.length ? (
                paginatedReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div className="font-medium">{reminder.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {reminder.person} · {reminder.notes || "Sem observações"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <ReminderTypeBadge type={reminder.type} />
                        <span className="text-xs text-muted-foreground">
                          {reminder.frequency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{formatDateKey(reminder.nextDueDate)}</span>
                        {isReminderDue(reminder, today) ? (
                          <span className="text-xs font-medium text-destructive">Cobrar agora</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Agendado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-36">
                      {reminder.type === "Parcelado" ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {reminder.remainingInstallments} de {reminder.totalInstallments} restantes
                          </span>
                          <Progress value={getReminderProgress(reminder)} />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Recorrente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ReminderStatusBadge status={reminder.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(reminder.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          disabled={reminder.status !== "Ativo"}
                          onClick={() => onMarkReceived(reminder)}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle2Icon data-icon="inline-start" />
                          Recebido
                        </Button>
                        <TableActions
                          onDelete={() => onDelete(reminder)}
                          onEdit={() => onEdit(reminder)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={7}>
                    Nenhum lembrete cadastrado. Use esta área para cobrar valores sem lançar receita.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
        <PaginationControls
          currentPage={currentPage}
          itemLabel="lembretes"
          onPageChange={setPage}
          pageCount={pageCount}
          totalItems={orderedReminders.length}
        />
      </CardContent>
    </Card>
  )
}

function ExpensesSection({
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
    [currentPage, expenses]
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
            <CardDescription>Despesas fixas cadastradas para acompanhar recorrência, vencimentos e status.</CardDescription>
          </div>
          <CardAction>
            <Button className={cn(newActionButtonClassName, expenseActionClassName)} onClick={onAdd}>
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
                      <TableActions onDelete={() => onDelete(expense)} onEdit={() => onEdit(expense)} />
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

function InvestmentsSection({
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
  const insight = getInvestmentInsight(summary.investmentInsight)
  const InsightIcon = insight.icon

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Defina o planejado, registre o realizado e compare a evolução mensal."
        title="Controle de investimentos"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <MetricCard label="Planejado" value={formatCurrency(summary.plannedInvestment)} />
        <MetricCard label="Realizado" value={formatCurrency(summary.investedAmount)} />
        <MetricCard label="Orçamento após investimentos" value={formatCurrency(summary.budgetRemainingAfterInvestment)} />
      </div>

      <Alert>
        <InsightIcon />
        <AlertTitle>{insight.title}</AlertTitle>
        <AlertDescription>{insight.description}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Histórico mensal de investimentos</CardTitle>
            <CardDescription>
              Use o mês atual para calcular o orçamento após investimentos.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              className="border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-500/30 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
              onClick={onAdd}
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Registrar aporte
            </Button>
          </CardAction>
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

function GoalsSection({ finance }: { finance: FinanceDashboardProps["finance"] }) {
  const { state } = finance
  const goals = useMemo(
    () => sortGoals(state.goals, state.goalContributions),
    [state.goalContributions, state.goals]
  )
  const contributions = state.goalContributions
  const [selectedGoalId, setSelectedGoalId] = useState<string>("")
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null)

  const selectedGoal = useMemo(() => {
    return goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null
  }, [goals, selectedGoalId])

  const selectedGoalContributions = useMemo(() => {
    if (!selectedGoal) {
      return []
    }

    return contributions
      .filter((contribution) => contribution.goalId === selectedGoal.id)
      .toSorted((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  }, [contributions, selectedGoal])

  const goalsSummary = useMemo(
    () => calculateGoalsSummary(goals, contributions),
    [contributions, goals]
  )
  const selectedGoalProgress = useMemo(
    () => (selectedGoal ? getGoalProgress(selectedGoal, selectedGoalContributions) : null),
    [selectedGoal, selectedGoalContributions]
  )
  const selectedGoalCompleted = Boolean(selectedGoalProgress && selectedGoalProgress.percent >= 100)
  const selectedGoalTimeline = useMemo(
    () => (selectedGoal ? getGoalTimeline(selectedGoal, selectedGoalContributions) : []),
    [selectedGoal, selectedGoalContributions]
  )
  const chartMaxValue = selectedGoal
    ? Math.max(
        selectedGoal.targetAmount,
        selectedGoalTimeline.at(-1)?.cumulativeAmount ?? 0,
        1000
      )
    : 1000
  const goalDeadlineLabel = selectedGoal ? formatGoalDeadline(selectedGoal) : "Sem prazo"

  function openCreateGoal() {
    setEditingGoal(null)
    setIsGoalDialogOpen(true)
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal)
    setSelectedGoalId(goal.id)
    setIsGoalDialogOpen(true)
  }

  function openContributionDialog(goalId?: string) {
    const nextGoalId = goalId ?? selectedGoal?.id ?? goals[0]?.id

    if (!nextGoalId) {
      return
    }

    setEditingContribution(null)
    setSelectedGoalId(nextGoalId)
    setIsContributionDialogOpen(true)
  }

  function openEditContribution(contribution: GoalContribution) {
    setEditingContribution(contribution)
    setSelectedGoalId(contribution.goalId)
    setIsContributionDialogOpen(true)
  }

  async function runGoalAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action()
      toast.success(successMessage)
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: getActionErrorMessage(error),
      })
      throw error
    }
  }

  async function handleDeleteGoal(goal: Goal) {
    if (!window.confirm(`Excluir a meta ${goal.name}? Os aportes vinculados também serão removidos.`)) {
      return
    }

    try {
      await finance.deleteGoal(goal.id)
      toast.success("Meta excluída")
    } catch (error) {
      toast.error("Não foi possível excluir a meta", {
        description: getActionErrorMessage(error),
      })
    }
  }

  async function handleDeleteContribution(contribution: GoalContribution) {
    if (!window.confirm("Excluir este aporte?")) {
      return
    }

    try {
      await finance.deleteGoalContribution(contribution.id)
      toast.success("Aporte removido")
    } catch (error) {
      toast.error("Não foi possível excluir o aporte", {
        description: getActionErrorMessage(error),
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Crie objetivos financeiros, registre aportes e acompanhe a evolução até a conclusão."
        title="Metas financeiras"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Metas ativas" value={String(goalsSummary.activeGoals)} />
        <MetricCard label="Valor alvo total" value={formatCurrency(goalsSummary.totalTarget)} />
        <MetricCard label="Valor aportado" value={formatCurrency(goalsSummary.totalContributed)} />
        <MetricCard label="Taxa de conclusão" value={formatPercent(goalsSummary.completionRate)} />
      </div>

      {!goals.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <TargetIcon className="size-10 text-muted-foreground" />
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma meta criada ainda</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Registre objetivos como um MacBook, uma reserva de emergência ou uma viagem e
                acompanhe o progresso por aportes.
              </p>
            </div>
            <Button onClick={openCreateGoal}>Criar primeira meta</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-foreground/10 bg-card/90 py-0 shadow-xl shadow-primary/5">
            <CardHeader className="bg-card px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Meta em foco</Badge>
                    {selectedGoalCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        Concluída
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="mt-3 text-2xl">
                    {selectedGoal?.name ?? "Selecione uma meta"}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl">
                    {selectedGoal
                      ? `${goalDeadlineLabel} · ${formatCurrency(
                          selectedGoalProgress?.currentAmount ?? 0
                        )} acumulados de ${formatCurrency(selectedGoal.targetAmount)}`
                      : "Escolha uma meta para acompanhar o progresso e os aportes vinculados."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-500/30 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
                    onClick={() => openContributionDialog(selectedGoal?.id)}
                    variant="outline"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Registrar aporte
                  </Button>
                  <Button
                    onClick={openCreateGoal}
                    className="border-violet-500/30 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 focus-visible:ring-violet-500/30 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
                    variant="outline"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Criar meta
                  </Button>
                  <Button
                    onClick={() => selectedGoal && openEditGoal(selectedGoal)}
                    variant="outline"
                  >
                    <Edit3Icon data-icon="inline-start" />
                    Editar meta
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5 sm:p-6 lg:p-8">
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {goals.map((goal) => (
                  <button
                    aria-pressed={goal.id === selectedGoal?.id}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      goal.id === selectedGoal?.id &&
                        "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    )}
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    type="button"
                  >
                    {goal.name}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="bg-background/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Evolução dos aportes</CardTitle>
                    <CardDescription>
                      Acompanhe quanto já foi acumulado até atingir o valor da meta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    {selectedGoalTimeline.length ? (
                      <ChartContainer className="h-[320px] w-full" config={goalChartConfig}>
                        <LineChart
                          accessibilityLayer
                          data={selectedGoalTimeline}
                          margin={{ left: 24, right: 16, top: 12 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
                          <YAxis
                            axisLine={false}
                            domain={[0, chartMaxValue + 1000]}
                            tickFormatter={(value) => formatShortCurrency(Number(value))}
                            tickLine={false}
                            width={64}
                          />
                          <ChartTooltip content={<GoalTooltip />} />
                          <ReferenceLine
                            ifOverflow="extendDomain"
                            label="Meta"
                            stroke="var(--color-targetAmount)"
                            strokeDasharray="6 6"
                            y={selectedGoal.targetAmount}
                          />
                          <Line
                            dataKey="cumulativeAmount"
                            dot={false}
                            stroke="var(--color-cumulativeAmount)"
                            strokeWidth={2.5}
                            type="monotone"
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                        <TargetIcon className="size-10 text-muted-foreground" />
                        <div className="space-y-2">
                          <p className="font-medium">Sem aportes registrados</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Use o botão de aporte para começar a visualizar a evolução da meta.
                          </p>
                        </div>
                        <Button onClick={() => openContributionDialog(selectedGoal?.id)}>
                          Registrar primeiro aporte
                        </Button>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
                      <ChartLegendItem color="var(--chart-3)" label="Acumulado" />
                      <ChartLegendItem color="var(--chart-4)" label="Meta" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Detalhes da meta</CardTitle>
                    <CardDescription>
                      Resumo rápido com prazo, saldo restante e status atual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {selectedGoal && selectedGoalProgress ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <GoalStatusBadge
                            completed={selectedGoalCompleted}
                            status={selectedGoal.status}
                          />
                          <span className="font-mono text-sm tabular-nums text-muted-foreground">
                            {selectedGoalProgress.percent.toFixed(1)}% concluído
                          </span>
                        </div>

                        <Progress value={selectedGoalProgress.percent} />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Acumulado
                            </p>
                            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
                              {formatCurrency(selectedGoalProgress.currentAmount)}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Falta atingir
                            </p>
                            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
                              {formatCurrency(selectedGoalProgress.remainingAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide">Prazo</p>
                            <p className="mt-1 font-medium text-foreground">
                              {goalDeadlineLabel}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide">Aportes</p>
                            <p className="mt-1 font-medium text-foreground">
                              {selectedGoalContributions.length} registro(s)
                            </p>
                          </div>
                        </div>

                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                        Selecione uma meta para ver seus detalhes.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-background/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Aportes da meta selecionada</CardTitle>
                  <CardDescription>
                    Registros recentes usados para compor a evolução acumulada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedGoalContributions.length ? (
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGoalContributions
                            .toSorted((a, b) => b.date.localeCompare(a.date))
                            .map((contribution) => (
                              <TableRow key={contribution.id}>
                                <TableCell>{formatDateKeyLong(contribution.date)}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                  {formatCurrency(contribution.amount)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      aria-label="Editar aporte"
                                      onClick={() => openEditContribution(contribution)}
                                      size="icon-sm"
                                      variant="ghost"
                                    >
                                      <Edit3Icon />
                                    </Button>
                                    <Button
                                      aria-label="Excluir aporte"
                                      onClick={() => handleDeleteContribution(contribution)}
                                      size="icon-sm"
                                      variant="ghost"
                                    >
                                      <Trash2Icon className="text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  ) : (
                    <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                      Nenhum aporte registrado para esta meta.
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Todas as metas</CardTitle>
              <CardDescription>
                Visão consolidada com valor alvo, valor acumulado e status de cada objetivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meta</TableHead>
                      <TableHead className="text-right">Alvo</TableHead>
                      <TableHead className="text-right">Acumulado</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal) => {
                      const progress = getGoalProgress(
                        goal,
                        contributions.filter((item) => item.goalId === goal.id)
                      )
                      const completed = progress.percent >= 100

                      return (
                        <TableRow
                          className={cn(goal.id === selectedGoal?.id && "bg-primary/5")}
                          key={goal.id}
                        >
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">{goal.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {progress.percent.toFixed(1)}% concluído
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(goal.targetAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(progress.currentAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(progress.remainingAmount)}
                          </TableCell>
                          <TableCell>{formatGoalDeadline(goal)}</TableCell>
                          <TableCell>
                            <GoalStatusBadge completed={completed} status={goal.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                aria-label="Editar meta"
                                onClick={() => openEditGoal(goal)}
                                size="icon-sm"
                                variant="ghost"
                              >
                                <Edit3Icon />
                              </Button>
                              <Button
                                aria-label="Excluir meta"
                                onClick={() => handleDeleteGoal(goal)}
                                size="icon-sm"
                                variant="ghost"
                              >
                                <Trash2Icon className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </>
      )}

      {isGoalDialogOpen ? (
        <GoalDialog
          goal={
            editingGoal && isGoalCompleted(editingGoal, contributions.filter((item) => item.goalId === editingGoal.id))
              ? { ...editingGoal, status: "Concluída" }
              : editingGoal
          }
          onOpenChange={setIsGoalDialogOpen}
          onSubmit={async (values) => {
            const currentAmount = editingGoal
              ? getGoalProgress(
                  editingGoal,
                  contributions.filter((item) => item.goalId === editingGoal.id)
                ).currentAmount
              : 0

            await runGoalAction(
              () => finance.upsertGoal(
                normalizeGoalFormValues(values, currentAmount),
                editingGoal?.id
              ),
              editingGoal ? "Meta atualizada" : "Meta criada"
            )
          }}
          open={isGoalDialogOpen}
        />
      ) : null}

      {isContributionDialogOpen ? (
        <GoalContributionDialog
          defaultGoalId={selectedGoal?.id ?? goals[0]?.id ?? ""}
          goals={goals}
          contribution={editingContribution}
          onOpenChange={(open) => {
            setIsContributionDialogOpen(open)
            if (!open) {
              setEditingContribution(null)
            }
          }}
          onSubmit={async (values, id) => {
            await runGoalAction(
              () => finance.upsertGoalContribution(values, id),
              editingContribution ? "Aporte atualizado" : "Aporte registrado"
            )
          }}
          open={isContributionDialogOpen}
        />
      ) : null}
    </div>
  )
}

function HistorySection({ history }: { history: ReturnType<typeof getMonthlyHistory> }) {
  const orderedHistory = useMemo(
    () => history.toSorted((a, b) => a.month.localeCompare(b.month)),
    [history]
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
    [orderedHistory]
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
                Análise aprofundada do mês selecionado, comparando contra o mês anterior e a média do histórico.
              </CardDescription>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {selectableMonths.map((item) => (
                <button
                  aria-pressed={item.month === referenceMonthKey}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    item.month === referenceMonthKey &&
                      "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
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
              <LineChart accessibilityLayer data={historyAnalysis} margin={{ left: 24, right: 16, top: 12 }}>
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
                <Line dataKey="income" dot={false} stroke="var(--color-income)" strokeWidth={2.5} type="monotone" />
                <Line dataKey="expenses" dot={false} stroke="var(--color-expenses)" strokeWidth={2.5} type="monotone" />
                <Line dataKey="plannedInvestment" dot={false} stroke="var(--color-plannedInvestment)" strokeWidth={2.5} type="monotone" />
                <Line dataKey="investedAmount" dot={false} stroke="var(--color-investedAmount)" strokeWidth={2.5} type="monotone" />
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
              <BarChart accessibilityLayer data={selectedMonthBreakdown} margin={{ left: 24, right: 16, top: 12 }}>
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

function TrendDelta({
  inverse,
  kind = "currency",
  value,
}: {
  inverse?: boolean
  kind?: "currency" | "percent"
  value: number
}) {
  const isNeutral = Math.abs(value) < 0.01
  const isPositive = inverse ? value < 0 : value > 0
  const formattedValue =
    kind === "percent" ? formatPercent(Math.abs(value)) : formatCurrency(Math.abs(value))
  const prefix = value > 0 ? "+" : value < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold tabular-nums",
        isNeutral && "text-muted-foreground",
        !isNeutral && isPositive && "text-emerald-600 dark:text-emerald-300",
        !isNeutral && !isPositive && "text-rose-600 dark:text-rose-300"
      )}
    >
      {prefix}
      {formattedValue}
    </span>
  )
}

function ChartLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

function AccountDialog({
  onDeleteAccount,
  onLogout,
  onOpenChange,
  onRequestPasswordReset,
  onUpdateUser,
  open,
  user,
}: {
  onDeleteAccount: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  onRequestPasswordReset: () => void
  onUpdateUser: (user: AppUser) => Promise<void> | void
  open: boolean
  user: AppUser
}) {
  const [draftName, setDraftName] = useState(user.name)
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(user.avatarUrl ?? "")
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    queueMicrotask(() => {
      setDraftName(user.name)
      setDraftAvatarUrl(user.avatarUrl ?? "")
    })
  }, [open, user.avatarUrl, user.name])

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter até 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Não foi possível carregar a imagem.")
        return
      }

      setDraftAvatarUrl(reader.result)
    }
    reader.onerror = () => toast.error("Não foi possível carregar a imagem.")
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextName = draftName.trim()

    if (!nextName) {
      toast.error("Informe um nome.")
      return
    }

    try {
      await onUpdateUser({
        ...user,
        avatarUrl: draftAvatarUrl || undefined,
        name: nextName,
      })
      toast.success("Perfil atualizado")
      onOpenChange(false)
    } catch (error) {
      toast.error("Não foi possível atualizar o perfil", {
        description: getActionErrorMessage(error),
      })
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
        <form className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <DialogTitle className="text-lg">Meu perfil</DialogTitle>
            <div className="flex items-center gap-1">
              <ThemeToggle size="small" />
              <DialogClose render={<Button aria-label="Fechar" size="icon-sm" variant="ghost" />}>
                <XIcon />
                <span className="sr-only">Fechar</span>
              </DialogClose>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <Avatar className="size-24">
                    {draftAvatarUrl ? (
                      <AvatarImage alt={draftName.trim() || user.name} src={draftAvatarUrl} />
                    ) : null}
                    <AvatarFallback className="text-xl">
                      {getInitials(draftName.trim() || user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -right-1 -bottom-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-within:ring-3 focus-within:ring-ring/50">
                    <CameraIcon />
                    <span className="sr-only">Alterar foto de perfil</span>
                    <input
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePhotoChange}
                      type="file"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-base font-semibold">{draftName.trim() || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Informações pessoais</p>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                      <Input
                        autoComplete="name"
                        id="profile-name"
                        onChange={(event) => setDraftName(event.target.value)}
                        placeholder="Digite seu nome"
                        value={draftName}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                      <Input
                        aria-readonly="true"
                        className="bg-muted/50 text-muted-foreground"
                        id="profile-email"
                        readOnly
                        value={user.email}
                      />
                    </Field>
                  </FieldGroup>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Segurança</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1 justify-center"
                      onClick={onRequestPasswordReset}
                      type="button"
                      variant="outline"
                    >
                      <KeyRoundIcon data-icon="inline-start" />
                      Alterar senha
                    </Button>
                    <Button
                      className="flex-1 justify-center"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      type="button"
                      variant="destructive"
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Excluir conta
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="justify-start"
                onClick={onLogout}
                type="button"
                variant="destructive"
              >
                <LogOutIcon data-icon="inline-start" />
                Sair
              </Button>

              <div className="flex gap-2 sm:justify-end">
                <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                  Cancelar
                </Button>
                <Button disabled={!draftName.trim()} type="submit">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>

      <Dialog onOpenChange={setIsDeleteConfirmOpen} open={isDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir conta?</DialogTitle>
            <DialogDescription>
              Essa ação remove permanentemente sua conta e todos os dados salvos no Valion.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsDeleteConfirmOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                onOpenChange(false)
                void onDeleteAccount()
              }}
              type="button"
              variant="destructive"
            >
              Excluir conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
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
  onSubmit: (values: IncomeFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    defaultValues: getIncomeDefaults(income),
    resolver: zodResolver(incomeSchema),
  })

  useEffect(() => {
    form.reset(getIncomeDefaults(income))
  }, [form, income, open])

  async function submit(values: IncomeFormValues) {
    await onSubmit(values)
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
                    label="Categoria"
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

function ReminderDialog({
  onOpenChange,
  onSubmit,
  open,
  reminder,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ReminderFormValues) => Promise<void> | void
  open: boolean
  reminder: ChargeReminder | null
}) {
  const form = useForm<ReminderFormInput, unknown, ReminderFormValues>({
    defaultValues: getReminderDefaults(reminder),
    resolver: zodResolver(reminderSchema),
  })
  const reminderType = useWatch({ control: form.control, name: "type" })

  useEffect(() => {
    form.reset(getReminderDefaults(reminder))
  }, [form, open, reminder])

  useEffect(() => {
    if (reminderType === "Recorrente") {
      form.setValue("remainingInstallments", 0)
      form.setValue("totalInstallments", 0)
      return
    }
  }, [form, reminderType])

  async function submit(values: ReminderFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reminder ? "Editar lembrete" : "Novo lembrete"}</DialogTitle>
          <DialogDescription>
            Registre cobranças a lembrar sem somar o valor nas receitas do dashboard.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField error={form.formState.errors.name} label="Nome" registration={form.register("name")} />
            <TextInputField
              error={form.formState.errors.person}
              label="De quem cobrar"
              registration={form.register("person")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Tipo"
                    onValueChange={(value) => field.onChange(value as ReminderType)}
                    options={REMINDER_TYPES}
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
                    onValueChange={(value) => field.onChange(value as ReminderStatus)}
                    options={REMINDER_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor da cobrança"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.nextDueDate}
                label="Próxima cobrança"
                registration={form.register("nextDueDate")}
                type="date"
              />
            </div>
            <Controller
              control={form.control}
              name="frequency"
              render={({ field, fieldState }) => (
                <SelectField
                  error={fieldState.error}
                  label="Periodicidade"
                  onValueChange={(value) => field.onChange(value as ReminderFrequency)}
                  options={REMINDER_FREQUENCIES}
                  value={field.value}
                />
              )}
            />
            {reminderType === "Parcelado" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInputField
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
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar lembrete</Button>
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
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    defaultValues: getExpenseDefaults(expense),
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    form.reset(getExpenseDefaults(expense))
  }, [expense, form, open])

  async function submit(values: ExpenseFormValues) {
    if (values.totalInstallments > 0 && values.remainingInstallments > values.totalInstallments) {
      form.setError("remainingInstallments", {
        message: "Parcelas restantes não podem exceder o total.",
        type: "validate",
      })
      return
    }

    await onSubmit(values)
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
  onSubmit: (values: InvestmentFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<InvestmentFormInput, unknown, InvestmentFormValues>({
    defaultValues: getInvestmentDefaults(investment),
    resolver: zodResolver(investmentSchema),
  })
  const selectedMonth = useWatch({ control: form.control, name: "month" })
  const monthOptions = useMemo(() => getAdjacentMonthKeys(selectedMonth ?? getCurrentMonthKey()), [selectedMonth])

  useEffect(() => {
    form.reset(getInvestmentDefaults(investment))
  }, [form, investment, open])

  async function submit(values: InvestmentFormValues) {
    await onSubmit(values)
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
            <Field data-invalid={Boolean(form.formState.errors.month)}>
              <FieldLabel>Mês</FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Mês anterior"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue("month", addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), -1), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="grid min-w-0 flex-1 grid-cols-5 gap-2">
                  {monthOptions.map((month) => (
                    <Button
                      aria-pressed={month === (selectedMonth ?? getCurrentMonthKey())}
                      className={cn(
                        "h-8 min-w-0 rounded-full px-2 text-xs",
                        month === (selectedMonth ?? getCurrentMonthKey())
                          ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      key={month}
                      onClick={() => {
                        form.setValue("month", month, { shouldDirty: true, shouldValidate: true })
                      }}
                      type="button"
                      variant="outline"
                    >
                      <span className="truncate">{formatMonthChip(month)}</span>
                    </Button>
                  ))}
                </div>
                <Button
                  aria-label="Próximo mês"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue("month", addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), 1), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              <FieldDescription>Escolha rapidamente entre os meses mais próximos.</FieldDescription>
              <FieldError>{form.formState.errors.month?.message}</FieldError>
            </Field>
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

function GoalDialog({
  goal,
  onOpenChange,
  onSubmit,
  open,
}: {
  goal: Goal | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalFormInput, unknown, GoalFormValues>({
    defaultValues: getGoalDefaults(goal),
    resolver: zodResolver(goalSchema),
  })
  const deadlineEnabled = useWatch({ control: form.control, name: "deadlineEnabled" })
  const selectedStatus = useWatch({ control: form.control, name: "status" })

  useEffect(() => {
    form.reset(getGoalDefaults(goal))
  }, [form, goal, open])

  useEffect(() => {
    if (!deadlineEnabled) {
      form.setValue("deadlineDate", "", { shouldDirty: true })
      return
    }

  }, [deadlineEnabled, form])

  async function submit(values: GoalFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Criar meta"}</DialogTitle>
          <DialogDescription>
            Defina o objetivo financeiro, o prazo e o status da sua meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome da meta"
              registration={form.register("name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.targetAmount}
                label="Valor alvo"
                registration={form.register("targetAmount")}
                type="number"
              />
            </div>
            <Field data-invalid={Boolean(form.formState.errors.deadlineEnabled || form.formState.errors.deadlineDate)}>
              <FieldLabel>Prazo</FieldLabel>
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    aria-pressed={!deadlineEnabled}
                    onClick={() => form.setValue("deadlineEnabled", false, { shouldDirty: true })}
                    size="sm"
                    type="button"
                    variant={!deadlineEnabled ? "default" : "outline"}
                  >
                    Sem prazo
                  </Button>
                  <Button
                    aria-pressed={deadlineEnabled}
                    onClick={() => {
                      form.setValue("deadlineEnabled", true, { shouldDirty: true })
                    }}
                    size="sm"
                    type="button"
                    variant={deadlineEnabled ? "default" : "outline"}
                  >
                    Com prazo
                  </Button>
                </div>
                {deadlineEnabled ? (
                  <TextInputField
                    error={form.formState.errors.deadlineDate}
                    label="Data do prazo"
                    registration={form.register("deadlineDate")}
                    type="date"
                  />
                ) : null}
                <FieldDescription>
                  Se preferir, lance a meta sem prazo para acompanhar apenas o progresso.
                </FieldDescription>
              </div>
            </Field>
            <SelectField
              error={form.formState.errors.status}
              label="Status"
              onValueChange={(value) => form.setValue("status", value, { shouldDirty: true })}
              options={GOAL_STATUSES}
              value={selectedStatus ?? "Ativa"}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar meta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GoalContributionDialog({
  contribution,
  defaultGoalId,
  goals,
  onOpenChange,
  onSubmit,
  open,
}: {
  contribution: GoalContribution | null
  defaultGoalId: string
  goals: Goal[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalContributionFormValues, id?: string) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalContributionFormInput, unknown, GoalContributionFormValues>({
    defaultValues: getGoalContributionDefaults(defaultGoalId, goals, contribution),
    resolver: zodResolver(goalContributionSchema),
  })
  const selectedGoalId = useWatch({ control: form.control, name: "goalId" })

  useEffect(() => {
    form.reset(getGoalContributionDefaults(defaultGoalId, goals, contribution))
  }, [contribution, defaultGoalId, form, goals, open])

  async function submit(values: GoalContributionFormValues) {
    await onSubmit(values, contribution?.id)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{contribution ? "Editar aporte" : "Registrar aporte"}</DialogTitle>
          <DialogDescription>
            Lance o valor aportado para atualizar a evolução da meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.goalId)}>
              <FieldLabel>Meta</FieldLabel>
              <Select
                items={goals.map((goal) => ({ label: goal.name, value: goal.id }))}
                onValueChange={(value) => {
                  if (value !== null) {
                    form.setValue("goalId", value, { shouldDirty: true, shouldValidate: true })
                  }
                }}
                value={selectedGoalId ?? ""}
              >
                <SelectTrigger aria-invalid={Boolean(form.formState.errors.goalId)} aria-label="Meta">
                  <SelectValue placeholder="Selecione uma meta" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.goalId?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor do aporte"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.date}
                label="Data do aporte"
                registration={form.register("date")}
                type="date"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">{contribution ? "Salvar alterações" : "Salvar aporte"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeader({
  actionLabel,
  actionClassName,
  description,
  onAction,
  title,
}: {
  actionLabel?: string
  actionClassName?: string
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
        <Button className={cn("w-full sm:w-auto", actionClassName)} onClick={onAction}>
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

function PaginationControls({
  currentPage,
  itemLabel,
  onPageChange,
  pageCount,
  totalItems,
}: {
  currentPage: number
  itemLabel: string
  onPageChange: (page: number) => void
  pageCount: number
  totalItems: number
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * TABLE_PAGE_SIZE + 1
  const endItem = Math.min(currentPage * TABLE_PAGE_SIZE, totalItems)

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          variant="outline"
        >
          Anterior
        </Button>
        <span className="font-mono text-xs tabular-nums">
          {currentPage}/{pageCount}
        </span>
        <Button
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          variant="outline"
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}

function TableActions({ onDelete, onEdit }: { onDelete: () => Promise<void> | void; onEdit: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button aria-label="Editar" onClick={onEdit} size="icon-sm" variant="ghost">
        <Edit3Icon />
      </Button>
      <Button aria-label="Excluir" onClick={onDelete} size="icon-sm" variant="ghost">
        <Trash2Icon className="text-destructive" />
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
        <SelectTrigger aria-invalid={Boolean(error)} aria-label={label} className="h-9 w-full">
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

function getBudgetCommitmentStatus(value: number) {
  if (value > 70) {
    return {
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
      description:
        "Nível crítico: despesas fixas consomem grande parte da renda. Revise contratos, parcelas e compromissos recorrentes com prioridade.",
      label: "Crítico",
    }
  }

  if (value > 55) {
    return {
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
      description:
        "Ponto de atenção: o orçamento começa a ficar pressionado. Avalie reduzir despesas fixas antes de assumir novos compromissos.",
      label: "Atenção",
    }
  }

  if (value > 40) {
    return {
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
      description:
        "Faixa saudável: os compromissos fixos estão controlados, mas ainda vale acompanhar aumentos recorrentes.",
      label: "Saudável",
    }
  }

  return {
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    description:
      "Margem confortável: há boa folga entre renda e despesas fixas para imprevistos, amortizações e investimentos.",
    label: "Confortável",
  }
}

function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const variant = status === "Ativa" ? "default" : status === "Pausada" ? "secondary" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  const variant = status === "Ativo" ? "default" : status === "Pausado" ? "secondary" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

function ReminderTypeBadge({ type }: { type: ReminderType }) {
  const variant = type === "Parcelado" ? "secondary" : "outline"

  return <Badge variant={variant}>{type}</Badge>
}

function GoalStatusBadge({
  completed = false,
  status,
}: {
  completed?: boolean
  status: GoalStatus
}) {
  if (completed || status === "Concluída") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
        Concluída
      </Badge>
    )
  }

  const variant = status === "Ativa" ? "default" : "secondary"

  return <Badge variant={variant}>{status}</Badge>
}

function isReminderDue(reminder: ChargeReminder, today: string) {
  return reminder.status === "Ativo" && reminder.nextDueDate <= today
}

function getReminderProgress(reminder: ChargeReminder) {
  if (reminder.totalInstallments <= 0) {
    return 0
  }

  const received = Math.max(reminder.totalInstallments - reminder.remainingInstallments, 0)
  return Math.min((received / reminder.totalInstallments) * 100, 100)
}

function getReminderStatusPriority(reminder: ChargeReminder) {
  if (reminder.status === "Ativo") {
    return 0
  }

  if (reminder.status === "Pausado") {
    return 1
  }

  return 2
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

function getIncomeDefaults(income: Income | null): IncomeFormInput {
  return {
    amount: income?.amount ?? "",
    frequency: income?.frequency ?? "Mensal",
    name: income?.name ?? "",
    notes: income?.notes ?? "",
    type: income?.type ?? "Salário",
  }
}

function getReminderDefaults(reminder: ChargeReminder | null): ReminderFormInput {
  return {
    amount: reminder?.amount ?? "",
    frequency: reminder?.frequency ?? "Mensal",
    name: reminder?.name ?? "",
    nextDueDate: reminder?.nextDueDate ?? getCurrentDateKey(),
    notes: reminder?.notes ?? "",
    person: reminder?.person ?? "",
    remainingInstallments: reminder?.remainingInstallments ?? "",
    status: reminder?.status ?? "Ativo",
    totalInstallments: reminder?.totalInstallments ?? "",
    type: reminder?.type ?? "Recorrente",
  }
}

function normalizeReminderFormValues(
  values: ReminderFormValues
): Omit<ChargeReminder, "createdAt" | "id"> {
  if (values.type === "Recorrente") {
    return {
      ...values,
      remainingInstallments: 0,
      totalInstallments: 0,
    }
  }

  return {
    ...values,
    status: values.remainingInstallments === 0 ? "Concluído" : values.status,
  }
}

function addMonthsToMonthKey(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + amount)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getAdjacentMonthKeys(monthKey: string) {
  return [-2, -1, 0, 1, 2].map((offset) => addMonthsToMonthKey(monthKey, offset))
}

function getExpenseDefaults(expense: FixedExpense | null): ExpenseFormInput {
  return {
    category: expense?.category ?? "Contas fixas",
    dueDay: expense?.dueDay ?? "",
    monthlyAmount: expense?.monthlyAmount ?? "",
    name: expense?.name ?? "",
    notes: expense?.notes ?? "",
    remainingInstallments: expense?.remainingInstallments ?? "",
    status: expense?.status ?? "Ativa",
    totalInstallments: expense?.totalInstallments ?? "",
  }
}

function getInvestmentDefaults(investment: InvestmentEntry | null): InvestmentFormInput {
  return {
    investedAmount: investment?.investedAmount ?? "",
    month: investment?.month ?? getCurrentMonthKey(),
    notes: investment?.notes ?? "",
    plannedAmount: investment?.plannedAmount ?? "",
  }
}

function calculateGoalsSummary(goals: Goal[], contributions: GoalContribution[]) {
  const totalTarget = goals.reduce((total, goal) => total + goal.targetAmount, 0)
  const totalContributed = contributions.reduce((total, contribution) => total + contribution.amount, 0)
  const completedGoals = goals.filter((goal) =>
    isGoalCompleted(goal, contributions.filter((item) => item.goalId === goal.id))
  ).length
  const activeGoals = goals.filter((goal) => {
    const progress = getGoalProgress(goal, contributions.filter((item) => item.goalId === goal.id))

    return goal.status === "Ativa" && progress.percent < 100
  }).length

  return {
    activeGoals,
    completedGoals,
    completionRate: totalTarget > 0 ? (totalContributed / totalTarget) * 100 : 0,
    totalContributed,
    totalTarget,
  }
}

function formatGoalDeadline(goal: Goal) {
  if (!goal.targetDate) {
    return "Sem prazo"
  }

  return formatDateKey(goal.targetDate)
}

function getGoalProgress(goal: Goal, contributions: GoalContribution[]) {
  const currentAmount = contributions.reduce((total, contribution) => total + contribution.amount, 0)
  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0)
  const percent = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0

  return {
    currentAmount,
    percent,
    remainingAmount,
  }
}

function getGoalTimeline(goal: Goal, contributions: GoalContribution[]) {
  let runningTotal = 0

  return contributions
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((contribution) => {
      runningTotal += contribution.amount

      return {
        cumulativeAmount: runningTotal,
        date: contribution.date,
        label: formatGoalChartLabel(contribution.date),
        targetAmount: goal.targetAmount,
      }
    })
}

function sortGoals(goals: Goal[], contributions: GoalContribution[]) {
  return goals.toSorted((a, b) => {
    const aCompleted = isGoalCompleted(a, contributions)
    const bCompleted = isGoalCompleted(b, contributions)

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1
    }

    const statusPriority = getGoalStatusPriority(a) - getGoalStatusPriority(b)

    if (statusPriority !== 0) {
      return statusPriority
    }

    const datePriority = (a.targetDate ?? "9999-12-31").localeCompare(b.targetDate ?? "9999-12-31")

    if (datePriority !== 0) {
      return datePriority
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

function getGoalStatusPriority(goal: Goal) {
  if (goal.status === "Ativa") {
    return 0
  }

  if (goal.status === "Pausada") {
    return 1
  }

  return 2
}

function isGoalCompleted(goal: Goal, contributions: GoalContribution[]) {
  return getGoalProgress(goal, contributions).percent >= 100
}

function getGoalDefaults(goal: Goal | null): GoalFormInput {
  return {
    deadlineDate: goal?.targetDate ?? "",
    deadlineEnabled: Boolean(goal?.targetDate),
    name: goal?.name ?? "",
    notes: goal?.notes ?? "",
    status: goal?.status ?? "Ativa",
    targetAmount: goal?.targetAmount ?? "",
  }
}

function normalizeGoalFormValues(
  values: GoalFormValues,
  currentAmount: number
): Omit<Goal, "createdAt" | "id"> {
  const targetAmount = values.targetAmount
  const completed = currentAmount >= targetAmount

  if (!values.deadlineEnabled) {
    return {
      name: values.name,
      notes: values.notes,
      status: completed ? "Concluída" : values.status === "Pausada" ? "Pausada" : "Ativa",
      targetAmount,
      targetDate: null,
    }
  }

  return {
    name: values.name,
    notes: values.notes,
    status: completed ? "Concluída" : values.status === "Pausada" ? "Pausada" : "Ativa",
    targetAmount,
    targetDate: values.deadlineDate || null,
  }
}

function getGoalContributionDefaults(
  defaultGoalId: string,
  goals: Goal[] = [],
  contribution: GoalContribution | null = null
): GoalContributionFormInput {
  return {
    amount: contribution?.amount ?? "",
    date: contribution?.date ?? getCurrentDateKey(),
    goalId: contribution?.goalId ?? (defaultGoalId || goals[0]?.id || ""),
    notes: contribution?.notes ?? "",
  }
}

function formatGoalChartLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "")
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
