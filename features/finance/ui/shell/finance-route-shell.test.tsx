import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FinanceDashboard } from "@/features/finance/ui/dashboard/finance-dashboard"
import { FinanceRouteShell } from "@/features/finance/ui/shell/finance-route-shell"
import type { AppUser } from "@/features/auth/types"
import { useFinanceStore } from "@/features/finance/hooks/use-finance-store"
import { toast } from "sonner"

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}))
const routeState = vi.hoisted(() => ({ pathname: "/dashboard" }))
const supabaseState = vi.hoisted(() => ({ client: null as SupabaseShellMock | null }))
const financeState = vi.hoisted(() => ({ store: null as FinanceStoreMock | null }))

type FinanceDashboardProps = ComponentProps<typeof FinanceDashboard>
type FinanceStoreMock = ReturnType<typeof createFinanceStore>
type SupabaseShellMock = ReturnType<typeof createSupabaseMock>

vi.mock("next/navigation", () => ({
  usePathname: () => routeState.pathname,
  useRouter: () => router,
}))

vi.mock("@/features/finance/hooks/use-finance-store", () => ({
  useFinanceStore: vi.fn(() => financeState.store),
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowser: vi.fn(() => supabaseState.client),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@/features/finance/ui/dashboard/finance-dashboard", () => ({
  FinanceDashboard: vi.fn((props: FinanceDashboardProps) => (
    <div data-testid="finance-dashboard">
      <span>{props.activeSection}</span>
      <span>{props.user.name}</span>
      <button onClick={() => props.onNavigateSection?.("expenses")} type="button">Ir despesas</button>
      <button onClick={() => void props.onLogout()} type="button">Sair</button>
      <button onClick={() => props.onRequestPasswordReset()} type="button">Alterar senha</button>
      <button onClick={() => void props.onDeleteAccount()} type="button">Excluir conta</button>
      <button
        onClick={() =>
          void props.onUpdateUser({
            avatarUrl: "https://example.com/avatar.png",
            createdAt: "2026-01-01T00:00:00.000Z",
            email: "ana@example.com",
            id: "user-1",
            name: "Ana Atualizada",
          })
        }
        type="button"
      >
        Atualizar perfil
      </button>
    </div>
  )),
}))

function createFinanceStore() {
  return {
    isReady: true,
    state: {},
  }
}

function createSupabaseMock() {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn(() => ({ eq }))

  return {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    eq,
    from: vi.fn(() => ({ update })),
    update,
  }
}

const initialUser: AppUser = {
  createdAt: "2026-01-01T00:00:00.000Z",
  email: "ana@example.com",
  id: "user-1",
  name: "Ana Silva",
}

describe("FinanceRouteShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.pathname = "/dashboard"
    financeState.store = createFinanceStore()
    supabaseState.client = createSupabaseMock()
    window.history.replaceState(null, "", "/dashboard")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ ok: true }), ok: true }))
  })

  it("renders children for routes outside the finance app", () => {
    routeState.pathname = "/login"

    render(<FinanceRouteShell initialUser={initialUser}>Conteúdo externo</FinanceRouteShell>)

    expect(screen.getByText("Conteúdo externo")).toBeInTheDocument()
    expect(FinanceDashboard).not.toHaveBeenCalled()
  })

  it("shows the loading shell while finance data is not ready", () => {
    financeState.store = { isReady: false, state: {} }

    render(<FinanceRouteShell initialUser={initialUser} />)

    expect(screen.queryByTestId("finance-dashboard")).not.toBeInTheDocument()
    expect(useFinanceStore).toHaveBeenCalledWith("user-1")
  })

  it("handles navigation, password reset and logout", async () => {
    const userEventInstance = userEvent.setup()
    render(<FinanceRouteShell initialUser={initialUser} />)

    await userEventInstance.click(screen.getByRole("button", { name: /Ir despesas/i }))
    expect(window.location.pathname).toBe("/despesas")
    expect(screen.getByText("expenses")).toBeInTheDocument()

    await userEventInstance.click(screen.getByRole("button", { name: /Alterar senha/i }))
    expect(router.push).toHaveBeenCalledWith("/alterar-senha")

    await userEventInstance.click(screen.getByRole("button", { name: /Sair/i }))
    await waitFor(() => expect(supabaseState.client?.auth.signOut).toHaveBeenCalled())
    expect(router.replace).toHaveBeenCalledWith("/login")
    expect(router.refresh).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith("Sessão encerrada")
  })

  it("updates profile and keeps service-role account deletion server-side", async () => {
    const userEventInstance = userEvent.setup()
    render(<FinanceRouteShell initialUser={initialUser} />)

    await userEventInstance.click(screen.getByRole("button", { name: /Atualizar perfil/i }))
    await waitFor(() => expect(supabaseState.client?.from).toHaveBeenCalledWith("profiles"))
    expect(supabaseState.client?.update).toHaveBeenCalledWith({
      avatar_url: "https://example.com/avatar.png",
      full_name: "Ana Atualizada",
    })
    expect(supabaseState.client?.eq).toHaveBeenCalledWith("id", "user-1")
    expect(await screen.findByText("Ana Atualizada")).toBeInTheDocument()

    await userEventInstance.click(screen.getByRole("button", { name: /Excluir conta/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/account", { method: "DELETE" }))
    expect(supabaseState.client?.auth.signOut).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith("/login")
    expect(toast.success).toHaveBeenCalledWith("Conta excluída", {
      description: "Sua conta e seus dados foram removidos permanentemente.",
    })
  })
})
