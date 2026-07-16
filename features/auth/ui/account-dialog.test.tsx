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
})
