import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AppUser } from "@/features/auth/types"
import type { FinanceState } from "@/features/finance/domain/types"
import { FinanceDashboard } from "@/features/finance/ui/dashboard/finance-dashboard"

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Alternar tema</button>,
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

type FinanceDashboardProps = ComponentProps<typeof FinanceDashboard>
type FinanceApi = FinanceDashboardProps["finance"]

function createState(overrides: Partial<FinanceState> = {}): FinanceState {
  return {
    expenses: [
      {
        category: "Contas fixas",
        createdAt: "2026-01-01T00:00:00.000Z",
        dueDay: 10,
        id: "expense-1",
        monthlyAmount: 1200,
        name: "Aluguel",
        remainingInstallments: 0,
        status: "Ativa",
        totalInstallments: 0,
      },
    ],
    goalContributions: [
      {
        amount: 200,
        createdAt: "2026-01-02T00:00:00.000Z",
        date: "2026-01-02",
        goalId: "goal-1",
        id: "contribution-1",
      },
    ],
    goals: [
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "goal-1",
        name: "Reserva",
        status: "Ativa",
        targetAmount: 1000,
        targetDate: "2026-12-31",
      },
    ],
    incomes: [
      {
        amount: 5000,
        createdAt: "2026-01-01T00:00:00.000Z",
        frequency: "Mensal",
        id: "income-1",
        name: "Salário",
        receivedOn: null,
        type: "Salário",
      },
    ],
    investments: [
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "investment-1",
        investedAmount: 300,
        month: "2026-01",
        plannedAmount: 500,
      },
    ],
    reminders: [
      {
        amount: 100,
        createdAt: "2026-01-01T00:00:00.000Z",
        frequency: "Mensal",
        id: "reminder-1",
        name: "Cobrar Ana",
        nextDueDate: "2026-01-10",
        person: "Ana",
        remainingInstallments: 2,
        status: "Ativo",
        totalInstallments: 3,
        type: "Parcelado",
      },
    ],
    snapshots: [
      {
        expenses: 1000,
        id: "snapshot-1",
        income: 4500,
        investedAmount: 250,
        month: "2025-12",
        plannedInvestment: 400,
      },
    ],
    ...overrides,
  }
}

function createFinance(overrides: Partial<FinanceApi> = {}): FinanceApi {
  return {
    clearWorkspace: vi.fn().mockResolvedValue(undefined),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    deleteGoalContribution: vi.fn().mockResolvedValue(undefined),
    deleteIncome: vi.fn().mockResolvedValue(undefined),
    deleteInvestment: vi.fn().mockResolvedValue(undefined),
    deleteReminder: vi.fn().mockResolvedValue(undefined),
    error: null,
    isReady: true,
    isSaving: false,
    markReminderReceived: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    resetWorkspace: vi.fn().mockResolvedValue(undefined),
    state: createState(),
    upsertExpense: vi.fn().mockResolvedValue(undefined),
    upsertGoal: vi.fn().mockResolvedValue(undefined),
    upsertGoalContribution: vi.fn().mockResolvedValue(undefined),
    upsertIncome: vi.fn().mockResolvedValue(undefined),
    upsertInvestment: vi.fn().mockResolvedValue(undefined),
    upsertReminder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const user: AppUser = {
  createdAt: "2026-01-01T00:00:00.000Z",
  email: "ana@example.com",
  id: "user-1",
  name: "Ana Silva",
}

function renderDashboard(props: Partial<FinanceDashboardProps> = {}) {
  const finance = props.finance ?? createFinance()

  render(
    <FinanceDashboard
      activeSection="dashboard"
      finance={finance}
      onDeleteAccount={vi.fn()}
      onLogout={vi.fn()}
      onRequestPasswordReset={vi.fn()}
      onUpdateUser={vi.fn()}
      user={user}
      {...props}
    />,
  )

  return { finance }
}

describe("FinanceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  it.each([
    ["dashboard", "Resumo do mês atual"],
    ["incomes", "Controle de receitas"],
    ["expenses", "Controle de despesas"],
    ["investments", "Controle de investimentos"],
    ["goals", "Metas financeiras"],
    ["history", "Histórico financeiro"],
  ] satisfies Array<[FinanceDashboardProps["activeSection"], string]>)(
    "renders the %s section",
    (_section, expectedText) => {
      renderDashboard({ activeSection: _section })

      expect(screen.getByText(expectedText)).toBeInTheDocument()
    },
  )

  it("guides a new account before showing empty charts", () => {
    renderDashboard({
      finance: createFinance({
        state: createState({
          expenses: [],
          incomes: [],
          investments: [],
          snapshots: [],
        }),
      }),
    })

    expect(screen.getByText("Comece por aqui")).toBeInTheDocument()
    expect(screen.getByText("Registre suas receitas")).toBeInTheDocument()
    expect(screen.queryByText("Receitas x despesas")).not.toBeInTheDocument()
  })

  it("highlights a spending category when its legend item is hovered", async () => {
    const userEventInstance = userEvent.setup()
    const state = createState()

    renderDashboard({
      finance: createFinance({
        state: createState({
          expenses: [
            ...state.expenses,
            {
              ...state.expenses[0],
              category: "Consórcios",
              id: "expense-2",
              monthlyAmount: 500,
              name: "Consórcios",
            },
          ],
        }),
      }),
    })

    const category = screen.getByRole("button", { name: /Consórcios/ })
    await userEventInstance.hover(category)

    expect(category).toHaveClass("bg-muted")
    expect(screen.getByRole("button", { name: /Contas fixas/ })).not.toHaveClass("bg-muted")
  })

  it("calls external navigation when a section is selected", async () => {
    const userEventInstance = userEvent.setup()
    const onNavigateSection = vi.fn()
    renderDashboard({ onNavigateSection })

    await userEventInstance.click(screen.getAllByRole("link", { name: /Receitas/i })[0])

    expect(onNavigateSection).toHaveBeenCalledWith("incomes")
  })

  it("submits a new income from the income dialog", async () => {
    const userEventInstance = userEvent.setup()
    const { finance } = renderDashboard({ activeSection: "incomes" })

    await userEventInstance.click(screen.getByRole("button", { name: /Nova receita/i }))
    const dialog = await screen.findByRole("dialog")
    await userEventInstance.type(within(dialog).getByLabelText("Nome"), "Freela")
    await userEventInstance.type(within(dialog).getByLabelText("Valor"), "800")
    await userEventInstance.click(within(dialog).getByRole("button", { name: /Salvar receita/i }))

    await waitFor(() =>
      expect(finance.upsertIncome).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 800, name: "Freela" }),
        undefined,
      ),
    )
    expect(toast.success).toHaveBeenCalledWith("Receita adicionada")
  })

  it("filters registered incomes without hiding the creation action", async () => {
    const userEventInstance = userEvent.setup()
    renderDashboard({ activeSection: "incomes" })

    const incomeButton = screen.getByRole("button", { name: "Nova receita" })
    expect(incomeButton).toHaveClass("sm:w-44", "h-11")
    const incomeCard = incomeButton.closest<HTMLElement>('[data-slot="card"]')
    expect(incomeCard).not.toBeNull()
    expect(
      within(incomeCard as HTMLElement).getByRole("button", { name: "Nova receita" }),
    ).toBeInTheDocument()
    expect(
      within(incomeCard as HTMLElement).getByRole("combobox", { name: "Categoria" }),
    ).toHaveTextContent("Todos")
    expect(
      within(incomeCard as HTMLElement).getByRole("combobox", { name: "Frequência" }),
    ).toHaveTextContent("Todas")
    expect(
      within(incomeCard as HTMLElement).getByText("Buscar", { selector: "label" }),
    ).toBeVisible()

    await userEventInstance.type(screen.getByRole("searchbox", { name: "Buscar receitas" }), "xyz")

    expect(screen.getByText("Nenhuma receita encontrada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nova receita" })).toBeInTheDocument()
  })

  it("keeps income and reminder creation actions in their collection headers when empty", () => {
    renderDashboard({
      activeSection: "incomes",
      finance: createFinance({ state: createState({ incomes: [], reminders: [] }) }),
    })

    expect(screen.getAllByRole("button", { name: "Nova receita" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Novo lembrete" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Nova receita" })).toHaveClass("sm:w-44", "h-11")
    expect(screen.getByRole("button", { name: "Novo lembrete" })).toHaveClass("sm:w-44", "h-11")
    expect(screen.getByText("Nenhuma receita cadastrada")).toBeInTheDocument()
    expect(screen.getByText("Nenhum lembrete cadastrado")).toBeInTheDocument()
  })

  it("keeps expense creation in the collection header when empty", () => {
    renderDashboard({
      activeSection: "expenses",
      finance: createFinance({ state: createState({ expenses: [] }) }),
    })

    expect(screen.getAllByRole("button", { name: "Nova despesa" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Nova despesa" })).toHaveClass("sm:w-44", "h-11")
    expect(screen.getByText("Nenhuma despesa cadastrada")).toBeInTheDocument()
  })

  it("keeps investment creation in the collection header when empty", () => {
    renderDashboard({
      activeSection: "investments",
      finance: createFinance({ state: createState({ investments: [] }) }),
    })

    expect(screen.getAllByRole("button", { name: "Registrar aporte" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Registrar aporte" })).toHaveClass("sm:w-44", "h-11")
    expect(screen.getByText("Nenhum investimento registrado")).toBeInTheDocument()
  })

  it("filters investments by performance", async () => {
    const userEventInstance = userEvent.setup()
    const state = createState()
    const entryAbove = {
      ...state.investments[0],
      id: "inv-1",
      month: "2026-09",
      plannedAmount: 500,
      investedAmount: 800,
    }
    const entryBelow = {
      ...state.investments[0],
      id: "inv-2",
      month: "2026-08",
      plannedAmount: 1000,
      investedAmount: 600,
    }
    renderDashboard({
      activeSection: "investments",
      finance: createFinance({ state: createState({ investments: [entryAbove, entryBelow] }) }),
    })

    const investmentButton = screen.getByRole("button", { name: "Registrar aporte" })
    const investmentCard = investmentButton.closest<HTMLElement>('[data-slot="card"]')
    expect(investmentCard).not.toBeNull()
    expect(
      within(investmentCard as HTMLElement).getByRole("button", { name: "Registrar aporte" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Desempenho" })).toHaveTextContent("Todos")

    await userEventInstance.click(screen.getByRole("combobox", { name: "Desempenho" }))
    expect(await screen.findByRole("option", { name: "Acima da meta" })).toBeInTheDocument()
    await userEventInstance.click(await screen.findByRole("option", { name: "Acima da meta" }))

    expect(screen.getAllByText("setembro de 2026").length).toBeGreaterThan(0)
    expect(screen.queryByText("agosto de 2026")).not.toBeInTheDocument()
  })

  it("filters incomes by frequency and lets the user clear the filter", async () => {
    const userEventInstance = userEvent.setup()
    const salary = createState().incomes[0]
    const bonus = {
      ...salary,
      amount: 800,
      frequency: "Única" as const,
      id: "income-bonus",
      name: "Bônus anual",
      receivedOn: "2026-09-01",
      type: "Renda extra" as const,
    }
    renderDashboard({
      activeSection: "incomes",
      finance: createFinance({ state: createState({ incomes: [salary, bonus] }) }),
    })

    await userEventInstance.click(screen.getByRole("combobox", { name: "Frequência" }))
    expect(await screen.findByRole("option", { name: "Todas" })).toBeInTheDocument()
    await userEventInstance.click(await screen.findByRole("option", { name: "Única" }))

    expect(screen.getAllByText("Bônus anual").length).toBeGreaterThan(0)
    expect(screen.queryByText("Salário")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Remover filtro Frequência: Única" }),
    ).toBeInTheDocument()

    await userEventInstance.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(screen.getAllByText("Salário").length).toBeGreaterThan(0)
  })

  it("filters expenses by category", async () => {
    const userEventInstance = userEvent.setup()
    const rent = createState().expenses[0]
    const consortium = {
      ...rent,
      category: "Consórcios" as const,
      id: "expense-consortium",
      name: "Consórcio de imóvel",
    }
    renderDashboard({
      activeSection: "expenses",
      finance: createFinance({ state: createState({ expenses: [rent, consortium] }) }),
    })

    const expenseButton = screen.getByRole("button", { name: "Nova despesa" })
    const expenseCard = expenseButton.closest<HTMLElement>('[data-slot="card"]')
    expect(expenseCard).not.toBeNull()
    expect(
      within(expenseCard as HTMLElement).getByRole("button", { name: "Nova despesa" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveTextContent("Todas")

    await userEventInstance.click(screen.getByRole("combobox", { name: "Categoria" }))
    expect(await screen.findByRole("option", { name: "Todas" })).toBeInTheDocument()
    await userEventInstance.click(await screen.findByRole("option", { name: "Consórcios" }))

    expect(screen.getAllByText("Consórcio de imóvel").length).toBeGreaterThan(0)
    expect(screen.queryByText("Aluguel")).not.toBeInTheDocument()
  })

  it("filters reminders by status", async () => {
    const userEventInstance = userEvent.setup()
    const activeReminder = createState().reminders[0]
    const pausedReminder = {
      ...activeReminder,
      id: "reminder-paused",
      name: "Cobrança pausada",
      status: "Pausado" as const,
    }
    renderDashboard({
      activeSection: "incomes",
      finance: createFinance({
        state: createState({ reminders: [activeReminder, pausedReminder] }),
      }),
    })

    const reminderButton = screen.getByRole("button", { name: "Novo lembrete" })
    expect(reminderButton).toHaveClass("sm:w-44", "h-11")
    const reminderCard = reminderButton.closest<HTMLElement>('[data-slot="card"]')
    expect(reminderCard).not.toBeNull()
    expect(
      within(reminderCard as HTMLElement).getByRole("button", { name: "Novo lembrete" }),
    ).toBeInTheDocument()
    expect(
      within(reminderCard as HTMLElement).getByRole("combobox", { name: "Tipo do lembrete" }),
    ).toHaveTextContent("Todos")

    await userEventInstance.click(screen.getByRole("combobox", { name: "Status" }))
    expect(await screen.findByRole("option", { name: "Todos" })).toBeInTheDocument()
    await userEventInstance.click(await screen.findByRole("option", { name: "Pausado" }))

    expect(screen.getAllByText("Cobrança pausada").length).toBeGreaterThan(0)
    expect(screen.queryByText("Cobrar Ana")).not.toBeInTheDocument()
  })

  it("shows all income and reminder records without pagination", () => {
    const state = createState()
    const incomes = Array.from({ length: 12 }, (_, index) => ({
      ...state.incomes[0],
      id: `income-${index}`,
      name: `Fonte ${index + 1}`,
    }))
    const reminders = Array.from({ length: 12 }, (_, index) => ({
      ...state.reminders[0],
      id: `reminder-${index}`,
      name: `Cobrança ${index + 1}`,
    }))
    renderDashboard({
      activeSection: "incomes",
      finance: createFinance({ state: createState({ incomes, reminders }) }),
    })

    expect(screen.getAllByText("Fonte 12").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Cobrança 12").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Próxima" })).not.toBeInTheDocument()
  })

  it("shows all expense records without pagination", () => {
    const expense = createState().expenses[0]
    const expenses = Array.from({ length: 12 }, (_, index) => ({
      ...expense,
      id: `expense-${index}`,
      name: `Despesa ${index + 1}`,
    }))
    renderDashboard({
      activeSection: "expenses",
      finance: createFinance({ state: createState({ expenses }) }),
    })

    expect(screen.getAllByText("Despesa 12").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Próxima" })).not.toBeInTheDocument()
  })

  it("deletes an income after confirmation", async () => {
    const userEventInstance = userEvent.setup()
    const { finance } = renderDashboard({ activeSection: "incomes" })

    await userEventInstance.click(screen.getAllByLabelText("Excluir")[0])

    await waitFor(() => expect(finance.deleteIncome).toHaveBeenCalledWith("income-1"))
    expect(window.confirm).toHaveBeenCalledWith('Excluir a receita "Salário"?')
  })

  it("marks a reminder as received", async () => {
    const userEventInstance = userEvent.setup()
    const { finance } = renderDashboard({ activeSection: "incomes" })

    await userEventInstance.click(screen.getAllByRole("button", { name: /Recebido/i })[0])

    await waitFor(() => expect(finance.markReminderReceived).toHaveBeenCalledWith("reminder-1"))
  })
})
