import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { IncomeDialog } from "@/features/finance/ui/routes/incomes-dialogs"

describe("IncomeDialog", () => {
  it("preserves the form when the native date picker reports an outside press", () => {
    const onOpenChange = vi.fn()

    render(
      <IncomeDialog
        income={{
          amount: 100,
          createdAt: "2026-07-16T00:00:00Z",
          frequency: "Única",
          id: "income-1",
          name: "Receita pontual",
          notes: "",
          receivedOn: "2026-07-16",
          type: "Renda extra",
        }}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
        open
      />,
    )

    expect(screen.getByLabelText("Data do recebimento")).toHaveValue("2026-07-16")
    fireEvent.pointerDown(document.body)

    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("submits a one-time income with its real receipt date", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn()

    render(<IncomeDialog income={null} onOpenChange={onOpenChange} onSubmit={onSubmit} open />)

    await user.type(screen.getByLabelText("Nome"), "Receita de teste")
    await user.type(screen.getByLabelText("Valor"), "150.25")
    await user.click(screen.getByRole("combobox", { name: "Frequência" }))
    await user.click(screen.getByRole("option", { name: "Única" }))
    fireEvent.change(screen.getByLabelText("Data do recebimento"), {
      target: { value: "2026-07-17" },
    })
    await user.click(screen.getByRole("button", { name: "Salvar receita" }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150.25,
          frequency: "Única",
          name: "Receita de teste",
          receivedOn: "2026-07-17",
        }),
      ),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes explicitly from the cancel action", async () => {
    const onOpenChange = vi.fn()

    render(<IncomeDialog income={null} onOpenChange={onOpenChange} onSubmit={vi.fn()} open />)

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
