import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FinanceRouteShell } from "@/features/finance/ui/shell/finance-route-shell"

const mocks = vi.hoisted(() => ({
  auth: {
    deleteAccount: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    user: {
      createdAt: "2026-01-01T00:00:00Z",
      email: "ana@example.com",
      id: "user-1",
      name: "Ana",
    },
  },
  finance: {
    error: null,
    expenses: { remove: vi.fn(), save: vi.fn() },
    goals: {
      remove: vi.fn(),
      removeContribution: vi.fn(),
      save: vi.fn(),
      saveContribution: vi.fn(),
    },
    incomes: { remove: vi.fn(), save: vi.fn() },
    investments: { remove: vi.fn(), save: vi.fn() },
    isPending: vi.fn(() => false),
    reminders: { markReceived: vi.fn(), remove: vi.fn(), save: vi.fn() },
    retry: vi.fn(),
    state: {
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
    },
    status: "ready",
  },
  pathname: "/dashboard",
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
}))
vi.mock("@/features/finance/providers/finance-provider", () => ({
  useFinance: () => mocks.finance,
}))
vi.mock("@/features/auth/providers/auth-session-provider", () => ({
  useAuthSession: () => mocks.auth,
}))
vi.mock("@/features/auth/ui/account-dialog", () => ({
  AccountDialog: () => <div>Conta aberta</div>,
}))
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }))

describe("FinanceRouteShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pathname = "/dashboard"
    mocks.finance.status = "ready"
  })

  it("renders the restored finance dashboard shell", async () => {
    render(
      <FinanceRouteShell>
        <h2>Conteúdo da rota</h2>
      </FinanceRouteShell>,
    )

    expect(screen.getByText("Resumo do mês atual")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Abrir menu" }))
    expect(await screen.findByRole("button", { name: "Receitas" })).toBeInTheDocument()
  })

  it("renders a retryable error instead of an empty dashboard", async () => {
    mocks.finance.status = "error"
    render(
      <FinanceRouteShell>
        <div />
      </FinanceRouteShell>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }))
    expect(mocks.finance.retry).toHaveBeenCalledTimes(1)
  })

  it("does not render the finance shell for an authenticated utility route", () => {
    mocks.pathname = "/alterar-senha"
    render(
      <FinanceRouteShell>
        <h2>Alterar senha</h2>
      </FinanceRouteShell>,
    )

    expect(screen.getByRole("heading", { name: "Alterar senha" })).toBeInTheDocument()
    expect(screen.queryByText("Resumo do mês atual")).not.toBeInTheDocument()
  })
})
