import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PasswordResetScreen } from "@/features/auth/ui/password-reset-screen"

type SupabaseResetMock = {
  auth: {
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
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
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  })

  it("validates fields, current password, and confirmation in standard change mode", async () => {
    const user = userEvent.setup()
    render(<PasswordResetScreen email="ana@example.com" onBack={vi.fn()} />)

    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com")
    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument()

    // 1. Sem preencher senha atual
    await user.type(screen.getByLabelText("Nova senha"), "123456")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123456")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("Informe a senha atual.")
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()
    expect(supabase().auth.updateUser).not.toHaveBeenCalled()

    // 2. Senha atual preenchida, mas nova senha curta
    await user.type(screen.getByLabelText("Senha atual"), "senha-antiga")
    await user.clear(screen.getByLabelText("Nova senha"))
    await user.clear(screen.getByLabelText("Confirmar nova senha"))
    await user.type(screen.getByLabelText("Nova senha"), "123")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("A senha deve ter pelo menos 6 caracteres.")
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()

    // 3. Confirmação não confere
    await user.clear(screen.getByLabelText("Nova senha"))
    await user.clear(screen.getByLabelText("Confirmar nova senha"))
    await user.type(screen.getByLabelText("Nova senha"), "123456")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "654321")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("As senhas não conferem.")
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()

    // 4. Nova senha igual à senha atual
    await user.clear(screen.getByLabelText("Nova senha"))
    await user.clear(screen.getByLabelText("Confirmar nova senha"))
    await user.type(screen.getByLabelText("Nova senha"), "senha-antiga")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senha-antiga")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(toastMock.error).toHaveBeenCalledWith("A nova senha deve ser diferente da senha atual.")
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("shows error when current password is wrong in standard change mode", async () => {
    const user = userEvent.setup()
    supabase().auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    })

    render(<PasswordResetScreen email="ana@example.com" onBack={vi.fn()} />)

    await user.type(screen.getByLabelText("Senha atual"), "senha-incorreta")
    await user.type(screen.getByLabelText("Nova senha"), "nova-senha-123")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-123")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    await waitFor(() =>
      expect(supabase().auth.signInWithPassword).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "senha-incorreta",
      }),
    )
    expect(toastMock.error).toHaveBeenCalledWith("A senha atual está incorreta.")
    expect(supabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it("updates password successfully when current password is valid", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<PasswordResetScreen email="ana@example.com" onBack={onBack} />)

    await user.type(screen.getByLabelText("Senha atual"), "senha-antiga")
    await user.type(screen.getByLabelText("Nova senha"), "nova-senha-123")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-123")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    await waitFor(() =>
      expect(supabase().auth.signInWithPassword).toHaveBeenCalledWith({
        email: "ana@example.com",
        password: "senha-antiga",
      }),
    )
    await waitFor(() =>
      expect(supabase().auth.updateUser).toHaveBeenCalledWith({ password: "nova-senha-123" }),
    )
    expect(toastMock.success).toHaveBeenCalledWith("Senha atualizada com sucesso", {
      description: "Use a nova senha no próximo acesso.",
    })
    expect(onBack).toHaveBeenCalled()
  })

  it("allows resetting password directly in recovery mode without current password", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<PasswordResetScreen email="ana@example.com" isRecovery onBack={onBack} />)

    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Nova senha"), "nova-senha-recuperada")
    await user.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-recuperada")
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }))

    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(supabase().auth.updateUser).toHaveBeenCalledWith({
        password: "nova-senha-recuperada",
      }),
    )
    expect(onBack).toHaveBeenCalled()
  })

  it("sends recovery email when clicking forgot current password link", async () => {
    const user = userEvent.setup()
    render(<PasswordResetScreen email="ana@example.com" onBack={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /esqueceu a senha atual\?/i }))

    await waitFor(() =>
      expect(supabase().auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "ana@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/callback?next=/alterar-senha"),
        }),
      ),
    )
    expect(toastMock.success).toHaveBeenCalledWith("E-mail de recuperação enviado!", {
      description: "Confira sua caixa de entrada para redefinir sua senha.",
    })
  })
})
