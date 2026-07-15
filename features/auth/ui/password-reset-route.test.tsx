import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PasswordResetRoute } from "@/features/auth/ui/password-reset-route"

type SupabaseResetRouteMock = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
  }
}

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseResetRouteMock | null,
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

describe("PasswordResetRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { email: "ana@example.com" } } }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  })

  it("redirects users without an email to login", async () => {
    supabaseState.client?.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    render(<PasswordResetRoute />)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"))
  })

  it("renders reset screen for authenticated users", async () => {
    render(<PasswordResetRoute />)

    expect(await screen.findByText("Redefinir senha")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com")
  })

  it("returns to dashboard from the reset screen", async () => {
    const user = userEvent.setup()
    render(<PasswordResetRoute />)

    await screen.findByText("Redefinir senha")
    await user.click(screen.getByRole("button", { name: /voltar/i }))

    expect(router.push).toHaveBeenCalledWith("/dashboard")
  })
})
