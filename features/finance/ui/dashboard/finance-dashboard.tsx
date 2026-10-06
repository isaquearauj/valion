"use client"

import { type ReactNode, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import type { AppUser, ProfileUpdate } from "@/features/auth/types"
import { AccountDialog } from "@/features/auth/ui/account-dialog"
import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import type {
  ChargeReminder,
  FinanceState,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"
import { normalizeReminderFormValues } from "@/features/finance/presentation/dashboard-view-models"
import {
  ExpenseDialog,
  IncomeDialog,
  InvestmentDialog,
  ReminderDialog,
} from "@/features/finance/ui/dialogs"
import {
  ExpensesSection,
  GoalsSection,
  HistorySection,
  IncomesSection,
  InvestmentsSection,
  OverviewSection,
} from "@/features/finance/ui/sections"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"
import { AppSidebar, TopBar } from "@/features/finance/ui/shell/workspace-navigation"
import type { AppSection } from "@/features/navigation/routes"
import { formatMonth } from "@/lib/formatters"

export type LegacyFinance = {
  error: string | null
  isReady: boolean
  isSaving: boolean
  state: FinanceState
  clearWorkspace?: () => Promise<void>
  reload?: () => Promise<void>
  resetWorkspace?: () => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  deleteGoalContribution: (id: string) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  markReminderReceived: (id: string) => Promise<void>
  upsertExpense: (values: Omit<FixedExpense, "createdAt" | "id">, id?: string) => Promise<void>
  upsertGoal: (values: Omit<Goal, "createdAt" | "id">, id?: string) => Promise<void>
  upsertGoalContribution: (
    values: Omit<GoalContribution, "createdAt" | "id">,
    id?: string,
  ) => Promise<void>
  upsertIncome: (values: Omit<Income, "createdAt" | "id">, id?: string) => Promise<void>
  upsertInvestment: (
    values: Omit<InvestmentEntry, "createdAt" | "id">,
    id?: string,
  ) => Promise<void>
  upsertReminder: (values: Omit<ChargeReminder, "createdAt" | "id">, id?: string) => Promise<void>
}

export type FinanceDashboardProps = {
  activeSection?: AppSection
  finance: LegacyFinance
  onDeleteAccount: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onNavigateSection?: (section: AppSection) => void
  onRequestEmailChange?: () => void
  onRequestPasswordReset: () => void
  onUpdateEmail?: (newEmail: string) => Promise<void>
  onUpdateUser: (update: ProfileUpdate) => Promise<void> | void
  user: AppUser
}

type SectionId = AppSection

export function FinanceDashboard({
  activeSection,
  finance,
  onDeleteAccount,
  onLogout,
  onNavigateSection,
  onRequestEmailChange,
  onRequestPasswordReset,
  onUpdateEmail,
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
        hasFinancialData={Boolean(
          state.incomes.length ||
            state.expenses.length ||
            state.investments.length ||
            state.snapshots.some(
              (snapshot) =>
                snapshot.income ||
                snapshot.expenses ||
                snapshot.plannedInvestment ||
                snapshot.investedAmount,
            ),
        )}
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
    goals: (
      <GoalsSection
        contributions={state.goalContributions}
        goals={state.goals}
        onDeleteContribution={finance.deleteGoalContribution}
        onDeleteGoal={finance.deleteGoal}
        onUpsertContribution={finance.upsertGoalContribution}
        onUpsertGoal={finance.upsertGoal}
      />
    ),
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
          onRequestEmailChange={onRequestEmailChange}
          onRequestPasswordReset={onRequestPasswordReset}
          onUpdateEmail={onUpdateEmail}
          onUpdateUser={onUpdateUser}
          open={isAccountDialogOpen}
          user={user}
        />
      ) : null}
    </main>
  )
}
