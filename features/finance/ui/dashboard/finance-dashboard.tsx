"use client"

import { CheckCircle2Icon, Edit3Icon, PlusIcon, TargetIcon, Trash2Icon } from "lucide-react"
import { type ReactNode, useMemo, useState, useTransition } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AppUser } from "@/features/auth/types"
import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getInstallmentProgress,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import { getCurrentDateKey } from "@/features/finance/domain/initial-data"
import type {
  ChargeReminder,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"
import type { useFinanceStore } from "@/features/finance/hooks/use-finance-store"
import {
  calculateGoalsSummary,
  formatGoalDeadline,
  formatShortCurrency,
  getGoalProgress,
  getGoalTimeline,
  getReminderProgress,
  getReminderStatusPriority,
  isGoalCompleted,
  isReminderDue,
  normalizeGoalFormValues,
  normalizeReminderFormValues,
  sortGoals,
} from "@/features/finance/presentation/dashboard-view-models"
import {
  distributionChartConfig,
  goalChartConfig,
  historyChartConfig,
} from "@/features/finance/ui/dashboard/chart-config"
import {
  AccountDialog,
  ExpenseDialog,
  GoalContributionDialog,
  GoalDialog,
  IncomeDialog,
  InvestmentDialog,
  ReminderDialog,
} from "@/features/finance/ui/dashboard/finance-dialogs"
import {
  CurrencyTooltip,
  GoalTooltip,
  OverviewSection,
} from "@/features/finance/ui/dashboard/overview-section"
import {
  ExpenseStatusBadge,
  GoalStatusBadge,
  getActionErrorMessage,
  getInvestmentInsight,
  MetricCard,
  PaginationControls,
  ReminderStatusBadge,
  ReminderTypeBadge,
  ResponsiveTable,
  SectionHeader,
  TABLE_PAGE_SIZE,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { AppSidebar, TopBar } from "@/features/finance/ui/shell/workspace-navigation"
import type { AppSection } from "@/features/navigation/routes"
import {
  formatCurrency,
  formatDateKey,
  formatDateKeyLong,
  formatDueDay,
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

type SectionId = AppSection

const incomeActionClassName =
  "border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"

const expenseActionClassName =
  "border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-500/30 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"

const reminderActionClassName =
  "border-orange-400/40 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20"

const newActionButtonClassName = "min-w-[9.5rem]"

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
        : "Cobrança marcada como recebida",
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
              editingIncome ? "Receita atualizada" : "Receita adicionada",
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
              editingExpense ? "Despesa atualizada" : "Despesa adicionada",
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
              editingInvestment ? "Investimento atualizado" : "Investimento registrado",
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
              () =>
                finance.upsertReminder(normalizeReminderFormValues(values), editingReminder?.id),
              editingReminder ? "Lembrete atualizado" : "Lembrete adicionado",
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
    [currentPage, incomes],
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
            <CardDescription>
              Valores semanais e quinzenais são normalizados para o mês.
            </CardDescription>
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
    [reminders],
  )
  const pageCount = Math.max(Math.ceil(orderedReminders.length / TABLE_PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const paginatedReminders = useMemo(
    () =>
      orderedReminders.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, orderedReminders],
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
                        <span className="text-xs text-muted-foreground">{reminder.frequency}</span>
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
                            {reminder.remainingInstallments} de {reminder.totalInstallments}{" "}
                            restantes
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
                    Nenhum lembrete cadastrado. Use esta área para cobrar valores sem lançar
                    receita.
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
    [currentPage, expenses],
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
            <CardDescription>
              Despesas fixas cadastradas para acompanhar recorrência, vencimentos e status.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              className={cn(newActionButtonClassName, expenseActionClassName)}
              onClick={onAdd}
            >
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
        <MetricCard
          label="Orçamento após investimentos"
          value={formatCurrency(summary.budgetRemainingAfterInvestment)}
        />
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
    [state.goalContributions, state.goals],
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
    [contributions, goals],
  )
  const selectedGoalProgress = useMemo(
    () => (selectedGoal ? getGoalProgress(selectedGoal, selectedGoalContributions) : null),
    [selectedGoal, selectedGoalContributions],
  )
  const selectedGoalCompleted = Boolean(selectedGoalProgress && selectedGoalProgress.percent >= 100)
  const selectedGoalTimeline = useMemo(
    () => (selectedGoal ? getGoalTimeline(selectedGoal, selectedGoalContributions) : []),
    [selectedGoal, selectedGoalContributions],
  )
  const chartMaxValue = selectedGoal
    ? Math.max(selectedGoal.targetAmount, selectedGoalTimeline.at(-1)?.cumulativeAmount ?? 0, 1000)
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
    if (
      !window.confirm(`Excluir a meta ${goal.name}? Os aportes vinculados também serão removidos.`)
    ) {
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
                          selectedGoalProgress?.currentAmount ?? 0,
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
                        "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
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
                          <XAxis
                            axisLine={false}
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                          />
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
                            <p className="mt-1 font-medium text-foreground">{goalDeadlineLabel}</p>
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
                        contributions.filter((item) => item.goalId === goal.id),
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
            editingGoal &&
            isGoalCompleted(
              editingGoal,
              contributions.filter((item) => item.goalId === editingGoal.id),
            )
              ? { ...editingGoal, status: "Concluída" }
              : editingGoal
          }
          onOpenChange={setIsGoalDialogOpen}
          onSubmit={async (values) => {
            const currentAmount = editingGoal
              ? getGoalProgress(
                  editingGoal,
                  contributions.filter((item) => item.goalId === editingGoal.id),
                ).currentAmount
              : 0

            await runGoalAction(
              () =>
                finance.upsertGoal(normalizeGoalFormValues(values, currentAmount), editingGoal?.id),
              editingGoal ? "Meta atualizada" : "Meta criada",
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
              editingContribution ? "Aporte atualizado" : "Aporte registrado",
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
        !isNeutral && !isPositive && "text-rose-600 dark:text-rose-300",
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
