import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PasswordResetScreen } from "@/features/auth/ui/password-reset-screen"
import { toast } from "sonner"

type SupabaseResetMock = {
  auth: {
    updateUser: ReturnType<typeof vi.fn>
  }
}

const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseResetMock | null,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowser: vi.fn(() => supabaseState.client),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const toastMock = vi.mocked(toast)

function supabase() {
  if (!supabaseState.client) {
    throw new Error("Supabase mock not configured")
  }

  return supabaseState.client
}

describe("PasswordResetScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = {
      auth: {
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  })

  it("blocks short passwords and mismatched confirmation", async () => {
    const user = userEvent.setup()
    render(<PasswordResetScreen email="ana@example.com" onBack={vi.fn()} />)

    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com")
    await user.type(screen.getByLabelText("Nova senha"), "123")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("A senha deve ter pelo menos 6 caracteres.")
    expect(supabase().auth.updateUser).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText("Nova senha"))
    await user.clear(screen.getByLabelText("Confirmar nova senha"))
    await user.type(screen.getByLabelText("Nova senha"), "123456")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "654321")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("As senhas não conferem.")
    expect(supabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it("shows update errors", async () => {
    const user = userEvent.setup()
    supabase().auth.updateUser.mockResolvedValueOnce({ error: { message: "Token inválido" } })
    render(<PasswordResetScreen email="ana@example.com" onBack={vi.fn()} />)

    await user.type(screen.getByLabelText("Nova senha"), "123456")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123456")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Não foi possível atualizar a senha", { description: "Token inválido" }))
  })

  it("updates password and returns on success", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<PasswordResetScreen email="ana@example.com" onBack={onBack} />)

    await user.type(screen.getByLabelText("Nova senha"), "123456")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123456")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    await waitFor(() => expect(supabase().auth.updateUser).toHaveBeenCalledWith({ password: "123456" }))
    expect(toastMock.success).toHaveBeenCalledWith("Senha atualizada", { description: "Use a nova senha no próximo acesso." })
    expect(onBack).toHaveBeenCalled()
  })
})
