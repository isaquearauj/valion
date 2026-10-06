import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EmailChangeRoute } from "@/features/auth/ui/email-change-route"

type SupabaseEmailChangeRouteMock = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
  }
}

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseEmailChangeRouteMock | null,
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

describe("EmailChangeRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { email: "usuario@example.com" } } }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  })

  it("redirects unauthenticated users to /login", async () => {
    supabaseState.client?.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    render(<EmailChangeRoute />)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"))
  })

  it("renders email change screen for authenticated user", async () => {
    render(<EmailChangeRoute />)

    expect(await screen.findByText("Alterar e-mail")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail atual")).toHaveValue("usuario@example.com")
  })
})
