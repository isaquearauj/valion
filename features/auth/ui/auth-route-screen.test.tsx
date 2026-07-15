import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthRouteScreen } from "@/features/auth/ui/auth-route-screen"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type SupabaseRouteMock = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
}

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseRouteMock | null,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowser: vi.fn(() => supabaseState.client),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock("@/features/auth/supabase-user", () => ({
  getAppUserFromSupabaseUser: vi.fn(),
}))

describe("AuthRouteScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    }
  })

  it("redirects authenticated users to dashboard", async () => {
    supabaseState.client?.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

    render(<AuthRouteScreen mode="login" />)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"))
    expect(screen.queryByRole("button", { name: /entrar no painel/i })).not.toBeInTheDocument()
  })

  it("renders auth screen when there is no current user", async () => {
    render(<AuthRouteScreen mode="login" />)

    expect(await screen.findByRole("button", { name: /entrar no painel/i })).toBeInTheDocument()
    expect(createSupabaseBrowser).toHaveBeenCalled()
  })

  it("uses auth paths when changing modes", async () => {
    const user = userEvent.setup()
    render(<AuthRouteScreen mode="login" />)

    await screen.findByRole("button", { name: /entrar no painel/i })
    await user.click(screen.getByRole("button", { name: /criar uma conta/i }))
    await user.click(screen.getByRole("button", { name: /esqueci minha senha/i }))

    expect(router.push).toHaveBeenCalledWith("/register")
    expect(router.push).toHaveBeenCalledWith("/recover")
  })
})
