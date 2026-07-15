import { getCurrentDateKey, getCurrentMonthKey } from "@/features/finance/domain/initial-data"
import type {
  ExpenseFormInput,
  GoalContributionFormInput,
  GoalFormInput,
  GoalFormValues,
  IncomeFormInput,
  InvestmentFormInput,
  ReminderFormInput,
  ReminderFormValues,
} from "@/features/finance/forms/schemas"
import type {
  ChargeReminder,
  FixedExpense,
  Goal,
  GoalContribution,
  Income,
  InvestmentEntry,
} from "@/features/finance/domain/types"
import { formatCurrency, formatDateKey } from "@/lib/formatters"

export function getBudgetCommitmentStatus(value: number) {
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

export function isReminderDue(reminder: ChargeReminder, today: string) {
  return reminder.status === "Ativo" && reminder.nextDueDate <= today
}

export function getReminderProgress(reminder: ChargeReminder) {
  if (reminder.totalInstallments <= 0) {
    return 0
  }

  const received = Math.max(reminder.totalInstallments - reminder.remainingInstallments, 0)
  return Math.min((received / reminder.totalInstallments) * 100, 100)
}

export function getReminderStatusPriority(reminder: ChargeReminder) {
  if (reminder.status === "Ativo") {
    return 0
  }

  if (reminder.status === "Pausado") {
    return 1
  }

  return 2
}

export function getIncomeDefaults(income: Income | null): IncomeFormInput {
  return {
    amount: income?.amount ?? "",
    frequency: income?.frequency ?? "Mensal",
    name: income?.name ?? "",
    notes: income?.notes ?? "",
    type: income?.type ?? "Salário",
  }
}

export function getReminderDefaults(reminder: ChargeReminder | null): ReminderFormInput {
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

export function normalizeReminderFormValues(
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

export function addMonthsToMonthKey(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + amount)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getAdjacentMonthKeys(monthKey: string) {
  return [-2, -1, 0, 1, 2].map((offset) => addMonthsToMonthKey(monthKey, offset))
}

export function getExpenseDefaults(expense: FixedExpense | null): ExpenseFormInput {
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

export function getInvestmentDefaults(investment: InvestmentEntry | null): InvestmentFormInput {
  return {
    investedAmount: investment?.investedAmount ?? "",
    month: investment?.month ?? getCurrentMonthKey(),
    notes: investment?.notes ?? "",
    plannedAmount: investment?.plannedAmount ?? "",
  }
}

export function calculateGoalsSummary(goals: Goal[], contributions: GoalContribution[]) {
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

export function formatGoalDeadline(goal: Goal) {
  if (!goal.targetDate) {
    return "Sem prazo"
  }

  return formatDateKey(goal.targetDate)
}

export function getGoalProgress(goal: Goal, contributions: GoalContribution[]) {
  const currentAmount = contributions.reduce((total, contribution) => total + contribution.amount, 0)
  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0)
  const percent = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0

  return {
    currentAmount,
    percent,
    remainingAmount,
  }
}

export function getGoalTimeline(goal: Goal, contributions: GoalContribution[]) {
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

export function sortGoals(goals: Goal[], contributions: GoalContribution[]) {
  return goals.toSorted((a, b) => {
    const aContributions = contributions.filter((item) => item.goalId === a.id)
    const bContributions = contributions.filter((item) => item.goalId === b.id)
    const aCompleted = isGoalCompleted(a, aContributions)
    const bCompleted = isGoalCompleted(b, bContributions)

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

export function getGoalStatusPriority(goal: Goal) {
  if (goal.status === "Ativa") {
    return 0
  }

  if (goal.status === "Pausada") {
    return 1
  }

  return 2
}

export function isGoalCompleted(goal: Goal, contributions: GoalContribution[]) {
  return getGoalProgress(goal, contributions).percent >= 100
}

export function getGoalDefaults(goal: Goal | null): GoalFormInput {
  return {
    deadlineDate: goal?.targetDate ?? "",
    deadlineEnabled: Boolean(goal?.targetDate),
    name: goal?.name ?? "",
    notes: goal?.notes ?? "",
    status: goal?.status ?? "Ativa",
    targetAmount: goal?.targetAmount ?? "",
  }
}

export function normalizeGoalFormValues(
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

export function getGoalContributionDefaults(
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

export function formatGoalChartLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "")
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function formatShortCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${Math.round(value / 1000)} mil`
  }

  return formatCurrency(value)
}
