import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FixedExpense } from "@/features/finance/domain/types"
import { ExpenseDialog } from "./expense-dialog"

describe("ExpenseDialog", () => {
  const sampleInstallmentExpense: FixedExpense = {
    category: "Parcelamentos",
    createdAt: "2026-01-01T00:00:00Z",
    dueDay: 10,
    id: "exp-1",
    monthlyAmount: 250,
    name: "Smartphone",
    notes: "",
    remainingInstallments: 5,
    status: "Ativa",
    totalInstallments: 10,
  }

  it("renderiza os botões de tipo com classe cursor-pointer", () => {
    render(<ExpenseDialog expense={null} onOpenChange={vi.fn()} onSubmit={vi.fn()} open={true} />)

    const recurringBtn = screen.getByRole("button", { name: "Recorrente / Contínua" })
    const installmentBtn = screen.getByRole("button", { name: "Compra parcelada" })

    expect(recurringBtn.className).toContain("cursor-pointer")
    expect(installmentBtn.className).toContain("cursor-pointer")
  })

  it("muda automaticamente o status para Quitada quando parcelas restantes vira 0", async () => {
    const user = userEvent.setup()

    render(
      <ExpenseDialog
        expense={sampleInstallmentExpense}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        open={true}
      />,
    )

    const remainingInput = screen.getByLabelText("Parcelas restantes")
    expect(remainingInput).toHaveValue(5)

    const statusTrigger = screen.getByRole("combobox", { name: "Status" })
    expect(statusTrigger).toHaveTextContent("Ativa")

    await user.clear(remainingInput)
    await user.type(remainingInput, "0")

    expect(statusTrigger).toHaveTextContent("Quitada")
  })

  it("restaura o status para Ativa quando parcelas restantes aumenta de 0 para um valor maior", async () => {
    const user = userEvent.setup()
    const quitadaExpense: FixedExpense = {
      ...sampleInstallmentExpense,
      remainingInstallments: 0,
      status: "Quitada",
    }

    render(
      <ExpenseDialog
        expense={quitadaExpense}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        open={true}
      />,
    )

    const remainingInput = screen.getByLabelText("Parcelas restantes")
    expect(remainingInput).toHaveValue(0)

    const statusTrigger = screen.getByRole("combobox", { name: "Status" })
    expect(statusTrigger).toHaveTextContent("Quitada")

    await user.clear(remainingInput)
    await user.type(remainingInput, "3")

    expect(statusTrigger).toHaveTextContent("Ativa")
  })

  it("preserva o status Pausada quando parcelas restantes for maior que zero", async () => {
    const pausedExpense: FixedExpense = {
      ...sampleInstallmentExpense,
      remainingInstallments: 3,
      status: "Pausada",
    }

    render(
      <ExpenseDialog
        expense={pausedExpense}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        open={true}
      />,
    )

    const statusTrigger = screen.getByRole("combobox", { name: "Status" })
    expect(statusTrigger).toHaveTextContent("Pausada")
  })
})
