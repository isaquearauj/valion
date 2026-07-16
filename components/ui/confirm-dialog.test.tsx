import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

describe("ConfirmDialog", () => {
  it("announces the destructive action and confirms explicitly", async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        description="O item será removido."
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
        open
        title="Excluir item?"
      />,
    )

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Excluir item?")
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("closes from the cancel action", async () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        description="Descrição"
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
        open
        title="Confirmar?"
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables both actions while pending", () => {
    render(
      <ConfirmDialog
        description="Descrição"
        isPending
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        open
        title="Confirmar?"
      />,
    )

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Aguarde..." })).toBeDisabled()
  })
})
