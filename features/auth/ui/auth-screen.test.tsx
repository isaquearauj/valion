import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthScreen } from "@/features/auth/ui/auth-screen"
import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"
import { createSupabaseBrowser } from "@/lib/supabase/client"
import { toast } from "sonner"

type SupabaseAuthMock = ReturnType<typeof createSupabaseMock>

const supabaseState = vi.hoisted(() => ({
  client: null as SupabaseAuthMock | null,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowser: vi.fn(() => supabaseState.client),
}))

vi.mock("@/features/auth/supabase-user", () => ({
  getAppUserFromSupabaseUser: vi.fn(),
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

const createSupabaseBrowserMock = vi.mocked(createSupabaseBrowser)
const getAppUserFromSupabaseUserMock = vi.mocked(getAppUserFromSupabaseUser)
const toastMock = vi.mocked(toast)

function createSupabaseMock() {
  return {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { session: { access_token: "token" }, user: { id: "user-1" } }, error: null }),
    },
  }
}

function supabase() {
  if (!supabaseState.client) {
    throw new Error("Supabase mock not configured")
  }

  return supabaseState.client
}

describe("AuthScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = createSupabaseMock()
    getAppUserFromSupabaseUserMock.mockResolvedValue({
      createdAt: "2026-01-01T00:00:00.000Z",
      email: "ana@example.com",
      id: "user-1",
      name: "Ana",
    })
  })

  it("blocks login with invalid email and short password before calling Supabase", async () => {
    const user = userEvent.setup()
    render(<AuthScreen mode="login" onAuthenticate={vi.fn()} />)

    await user.type(screen.getByLabelText("E-mail"), "email-invalido")
    await user.click(screen.getByRole("button", { name: /entrar no painel/i }))

    expect(await screen.findByText("Informe um e-mail válido para continuar.")).toBeInTheDocument()
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText("E-mail"))
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "123")
    await user.click(screen.getByRole("button", { name: /entrar no painel/i }))

    expect(await screen.findByText("A senha deve ter pelo menos 6 caracteres.")).toBeInTheDocument()
    expect(supabase().auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("shows generic login errors and confirmed-email guidance", async () => {
    const user = userEvent.setup()
    supabase().auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    })
    render(<AuthScreen mode="login" onAuthenticate={vi.fn()} />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /entrar no painel/i }))

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument()

    supabase().auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Email not confirmed" },
    })
    await user.click(screen.getByRole("button", { name: /entrar no painel/i }))

    expect(await screen.findByText("Confirme seu e-mail antes de entrar.")).toBeInTheDocument()
  })

  it("authenticates a valid login", async () => {
    const user = userEvent.setup()
    const onAuthenticate = vi.fn()
    render(<AuthScreen mode="login" onAuthenticate={onAuthenticate} />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /entrar no painel/i }))

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith(expect.objectContaining({ id: "user-1" })))
    expect(supabase().auth.signInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "123456",
    })
    expect(toastMock.success).toHaveBeenCalledWith("Sessão iniciada", { description: "Bem-vindo ao Valion." })
  })

  it("registers with an email-derived fallback name", async () => {
    const user = userEvent.setup()
    const onAuthenticate = vi.fn()
    render(<AuthScreen mode="register" onAuthenticate={onAuthenticate} />)

    await user.type(screen.getByLabelText("E-mail"), "joao-pedro.dev@example.com")
    await user.type(screen.getByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /criar conta/i }))

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalled())
    expect(supabase().auth.signUp).toHaveBeenCalledWith({
      email: "joao-pedro.dev@example.com",
      options: {
        data: { full_name: "joao pedro dev" },
        emailRedirectTo: "http://localhost:3000/auth/callback?next=/dashboard",
      },
      password: "123456",
    })
  })

  it("handles sign-up that requires e-mail confirmation", async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    supabase().auth.signUp.mockResolvedValueOnce({ data: { session: null, user: { id: "user-1" } }, error: null })
    render(<AuthScreen mode="register" onAuthenticate={vi.fn()} onModeChange={onModeChange} />)

    await user.type(screen.getByLabelText("Nome"), "Ana")
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /criar conta/i }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Conta criada", expect.any(Object)))
    expect(onModeChange).toHaveBeenCalledWith("login")
  })

  it("sends password recovery without revealing account existence", async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    render(<AuthScreen mode="recover" onAuthenticate={vi.fn()} onModeChange={onModeChange} />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: /enviar instruções/i }))

    await waitFor(() => expect(supabase().auth.resetPasswordForEmail).toHaveBeenCalled())
    expect(supabase().auth.resetPasswordForEmail).toHaveBeenCalledWith("ana@example.com", {
      redirectTo: "http://localhost:3000/auth/callback?next=/alterar-senha",
    })
    expect(toastMock.success).toHaveBeenCalledWith("Instruções enviadas", {
      description: "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
    })
    expect(onModeChange).toHaveBeenCalledWith("login")
  })

  it("uses route mode changes when provided", async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    render(<AuthScreen mode="login" onAuthenticate={vi.fn()} onModeChange={onModeChange} />)

    await user.click(screen.getByRole("button", { name: /criar uma conta/i }))
    await user.click(screen.getByRole("button", { name: /esqueci minha senha/i }))

    expect(onModeChange).toHaveBeenCalledWith("register")
    expect(onModeChange).toHaveBeenCalledWith("recover")
    expect(createSupabaseBrowserMock).toHaveBeenCalled()
  })
})
