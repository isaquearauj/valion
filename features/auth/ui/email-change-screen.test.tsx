import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EmailChangeScreen } from "@/features/auth/ui/email-change-screen"

type SupabaseEmailChangeMock = {
  auth: {
    signInWithPassword: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
  }
}

const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseEmailChangeMock | null,
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

describe("EmailChangeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  })

  it("validates empty email, invalid email format, same email and empty password", async () => {
    const user = userEvent.setup()
    render(<EmailChangeScreen currentEmail="antigo@example.com" onBack={vi.fn()} />)

    expect(screen.getByLabelText("E-mail atual")).toHaveValue("antigo@example.com")

    // 1. Submit sem e-mail novo
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))
    expect(toastMock.error).toHaveBeenCalledWith("Informe o novo endereço de e-mail.")
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()

    // 2. Formato inválido
    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "invalido")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))
    expect(toastMock.error).toHaveBeenCalledWith("Formato de e-mail inválido.")

    // 3. Mesmo e-mail
    await user.clear(screen.getByLabelText(/novo endereço de e-mail/i))
    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "antigo@example.com")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))
    expect(toastMock.error).toHaveBeenCalledWith("O novo e-mail deve ser diferente do atual.")

    // 4. Sem senha
    await user.clear(screen.getByLabelText(/novo endereço de e-mail/i))
    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "novo@example.com")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))
    expect(toastMock.error).toHaveBeenCalledWith(
      "Informe sua senha atual para autorizar a alteração.",
    )
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("shows error when current password is wrong", async () => {
    supabaseState.client?.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error("Invalid login credentials"),
    })

    const user = userEvent.setup()
    render(<EmailChangeScreen currentEmail="antigo@example.com" onBack={vi.fn()} />)

    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "novo@example.com")
    await user.type(screen.getByLabelText("Senha atual"), "senha-errada")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))

    expect(supabase().auth.signInWithPassword).toHaveBeenCalledWith({
      email: "antigo@example.com",
      password: "senha-errada",
    })
    expect(toastMock.error).toHaveBeenCalledWith("A senha atual está incorreta.")
    expect(supabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it("submits email update when credentials and email are valid", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<EmailChangeScreen currentEmail="antigo@example.com" onBack={onBack} />)

    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "  Novo@Example.com  ")
    await user.type(screen.getByLabelText("Senha atual"), "senha-correta")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))

    expect(supabase().auth.signInWithPassword).toHaveBeenCalledWith({
      email: "antigo@example.com",
      password: "senha-correta",
    })
    expect(supabase().auth.updateUser).toHaveBeenCalledWith(
      { email: "novo@example.com" },
      { emailRedirectTo: "http://localhost:3000/auth/callback?next=/dashboard" },
    )

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Confirmação enviada!", expect.any(Object))
      expect(onBack).toHaveBeenCalled()
    })
  })

  it("handles error returned by supabase updateUser", async () => {
    supabaseState.client?.auth.updateUser.mockResolvedValueOnce({
      data: null,
      error: { message: "Email already registered" },
    })

    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<EmailChangeScreen currentEmail="antigo@example.com" onBack={onBack} />)

    await user.type(screen.getByLabelText(/novo endereço de e-mail/i), "outro@example.com")
    await user.type(screen.getByLabelText("Senha atual"), "senha-correta")
    await user.click(screen.getByRole("button", { name: /confirmar alteração/i }))

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Não foi possível solicitar a alteração de e-mail",
        {
          description: "Email already registered",
        },
      )
      expect(onBack).not.toHaveBeenCalled()
    })
  })

  it("calls onBack when Voltar is clicked", async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<EmailChangeScreen currentEmail="antigo@example.com" onBack={onBack} />)

    await user.click(screen.getByRole("button", { name: "Voltar ao painel" }))
    expect(onBack).toHaveBeenCalled()
  })
})
