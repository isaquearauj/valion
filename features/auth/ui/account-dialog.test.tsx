import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AccountDialog } from "@/features/auth/ui/account-dialog"

vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }))

const user = {
  createdAt: "2026-01-01T00:00:00Z",
  email: "ana@example.com",
  id: "user-1",
  name: "Ana",
}

describe("AccountDialog", () => {
  it("rejects an empty name using the submitted field value", async () => {
    const onOpenChange = vi.fn()
    const onUpdateUser = vi.fn()

    render(
      <AccountDialog
        onDeleteAccount={vi.fn()}
        onLogout={vi.fn()}
        onOpenChange={onOpenChange}
        onRequestPasswordReset={vi.fn()}
        onUpdateUser={onUpdateUser}
        open
        user={user}
      />,
    )

    await userEvent.clear(screen.getByLabelText("Nome"))
    expect(screen.getByLabelText("Nome")).toHaveValue("")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByText("Informe um nome.")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true")
    expect(onUpdateUser).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("switches to the security tab and triggers onRequestEmailChange when Alterar e-mail is clicked", async () => {
    const onRequestEmailChange = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <AccountDialog
        onDeleteAccount={vi.fn()}
        onLogout={vi.fn()}
        onOpenChange={onOpenChange}
        onRequestEmailChange={onRequestEmailChange}
        onRequestPasswordReset={vi.fn()}
        onUpdateUser={vi.fn()}
        open
        user={user}
      />,
    )

    // Clica na aba Segurança
    await userEvent.click(screen.getByRole("tab", { name: /segurança/i }))

    // Clica no botão de alterar e-mail
    await userEvent.click(screen.getByRole("button", { name: "Alterar e-mail" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onRequestEmailChange).toHaveBeenCalledTimes(1)
  })

  it("triggers onRequestPasswordReset and closes dialog when Alterar senha is clicked", async () => {
    const onRequestPasswordReset = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <AccountDialog
        onDeleteAccount={vi.fn()}
        onLogout={vi.fn()}
        onOpenChange={onOpenChange}
        onRequestPasswordReset={onRequestPasswordReset}
        onUpdateUser={vi.fn()}
        open
        user={user}
      />,
    )

    // Clica na aba Segurança
    await userEvent.click(screen.getByRole("tab", { name: /segurança/i }))

    // Clica no botão Alterar senha
    await userEvent.click(screen.getByRole("button", { name: "Alterar senha" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onRequestPasswordReset).toHaveBeenCalledTimes(1)
  })
})
