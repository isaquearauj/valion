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
        notes: "Contrato anual",
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
        notes: "",
      },
    ],
    goals: [
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "goal-1",
        name: "Reserva",
        notes: "",
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
        notes: "Principal",
        type: "Salário",
      },
    ],
    investments: [
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "investment-1",
        investedAmount: 300,
        month: "2026-01",
        notes: "",
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
        notes: "",
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
    updatedAt: "2026-01-03T00:00:00.000Z",
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
    ["expenses", "Controle de despesas fixas"],
    ["investments", "Controle de investimentos"],
    ["goals", "Metas financeiras"],
    ["history", "Histórico financeiro"],
  ] satisfies Array<
    [FinanceDashboardProps["activeSection"], string]
  >)("renders the %s section", (_section, expectedText) => {
    renderDashboard({ activeSection: _section })

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it("calls external navigation when a section is selected", async () => {
    const userEventInstance = userEvent.setup()
    const onNavigateSection = vi.fn()
    renderDashboard({ onNavigateSection })

    await userEventInstance.click(screen.getAllByRole("button", { name: /Receitas/i })[0])

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

    await userEventInstance.click(screen.getByRole("button", { name: /Recebido/i }))

    await waitFor(() => expect(finance.markReminderReceived).toHaveBeenCalledWith("reminder-1"))
  })
})
